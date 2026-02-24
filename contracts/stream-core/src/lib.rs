#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};
use gstd::msg as gstd_msg;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn encode_call(service: &str, method: &str, args: impl Encode) -> Vec<u8> {
    let mut payload = Vec::new();
    service.encode_to(&mut payload);
    method.encode_to(&mut payload);
    args.encode_to(&mut payload);
    payload
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

pub type StreamId = u64;

#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
pub enum StreamStatus {
    Active,
    Paused,
    Stopped,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct Stream {
    pub id: StreamId,
    pub sender: ActorId,
    pub receiver: ActorId,
    pub token: ActorId,
    pub flow_rate: u128,
    pub start_time: u64,
    pub last_update: u64,
    pub deposited: u128,
    pub withdrawn: u128,
    pub streamed: u128,
    pub status: StreamStatus,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct Config {
    pub admin: ActorId,
    pub min_buffer_seconds: u64,
    pub next_stream_id: StreamId,
    pub token_vault: ActorId,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

static mut STATE: Option<StreamCoreState> = None;

pub struct StreamCoreState {
    pub config: Config,
    pub streams: BTreeMap<StreamId, Stream>,
    pub sender_streams: BTreeMap<ActorId, Vec<StreamId>>,
    pub receiver_streams: BTreeMap<ActorId, Vec<StreamId>>,
    pub active_count: u64,
}

impl StreamCoreState {
    fn new(admin: ActorId, min_buffer_seconds: u64) -> Self {
        Self {
            config: Config {
                admin,
                min_buffer_seconds,
                next_stream_id: 1,
                token_vault: ActorId::zero(),
            },
            streams: BTreeMap::new(),
            sender_streams: BTreeMap::new(),
            receiver_streams: BTreeMap::new(),
            active_count: 0,
        }
    }

    fn get() -> &'static mut Self {
        unsafe { STATE.as_mut().expect("State not initialized") }
    }

    fn accrued_since_last_update(stream: &Stream, now: u64) -> u128 {
        if stream.status != StreamStatus::Active || now <= stream.last_update {
            return 0;
        }
        let elapsed = (now - stream.last_update) as u128;
        stream.flow_rate.saturating_mul(elapsed)
    }

    fn total_streamed(stream: &Stream, now: u64) -> u128 {
        stream
            .streamed
            .saturating_add(Self::accrued_since_last_update(stream, now))
    }

    fn withdrawable_balance(stream: &Stream, now: u64) -> u128 {
        let total = Self::total_streamed(stream, now);
        let capped = total.min(stream.deposited);
        capped.saturating_sub(stream.withdrawn)
    }

    fn remaining_buffer(stream: &Stream, now: u64) -> u128 {
        let total = Self::total_streamed(stream, now);
        stream.deposited.saturating_sub(total)
    }

    fn settle(stream: &mut Stream, now: u64) {
        if stream.status == StreamStatus::Active {
            let accrued = Self::accrued_since_last_update(stream, now);
            stream.streamed = stream.streamed.saturating_add(accrued);
            if stream.streamed > stream.deposited {
                stream.streamed = stream.deposited;
            }
            stream.last_update = now;
        }
    }

    fn should_liquidate(stream: &Stream, now: u64, min_buffer_seconds: u64) -> bool {
        if stream.status != StreamStatus::Active || stream.flow_rate == 0 {
            return false;
        }
        let remaining = Self::remaining_buffer(stream, now);
        let min_buffer = stream.flow_rate.saturating_mul(min_buffer_seconds as u128);
        remaining < min_buffer
    }
}

// ---------------------------------------------------------------------------
// Program (constructor)
// ---------------------------------------------------------------------------

pub struct StreamCoreProgram;

#[program]
impl StreamCoreProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        unsafe {
            STATE = Some(StreamCoreState::new(admin, 3600));
        }
        Self
    }

    pub fn stream_service(&self) -> StreamService {
        StreamService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct StreamService;

impl StreamService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl StreamService {
    // ---- Commands ----

    pub fn create_stream(
        &mut self,
        receiver: ActorId,
        token: ActorId,
        flow_rate: u128,
        initial_deposit: u128,
    ) -> u64 {
        let state = StreamCoreState::get();
        let sender = msg::source();
        let now = exec::block_timestamp() / 1000;

        assert!(flow_rate > 0, "Flow rate must be > 0");
        assert!(sender != receiver, "Sender and receiver must differ");

        let min_deposit = flow_rate.saturating_mul(state.config.min_buffer_seconds as u128);
        assert!(
            initial_deposit >= min_deposit,
            "Initial deposit must cover minimum buffer"
        );

        let id = state.config.next_stream_id;
        state.config.next_stream_id += 1;

        let stream = Stream {
            id,
            sender,
            receiver,
            token,
            flow_rate,
            start_time: now,
            last_update: now,
            deposited: initial_deposit,
            withdrawn: 0,
            streamed: 0,
            status: StreamStatus::Active,
        };

        state.streams.insert(id, stream);
        state.sender_streams.entry(sender).or_default().push(id);
        state.receiver_streams.entry(receiver).or_default().push(id);
        state.active_count += 1;

        let payload = encode_call(
            "VaultService",
            "AllocateToStream",
            (sender, token, initial_deposit, id)
        );
        gstd_msg::send_bytes_with_gas(
            state.config.token_vault,
            payload,
            5_000_000_000,
            0
        ).expect("Vault allocate failed");

        id
    }

    pub fn update_stream(&mut self, stream_id: u64, new_flow_rate: u128) {
        let state = StreamCoreState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.sender == caller, "Only sender can update stream");
        assert!(
            stream.status != StreamStatus::Stopped,
            "Cannot update a stopped stream"
        );
        assert!(new_flow_rate > 0, "Flow rate must be > 0");

        StreamCoreState::settle(stream, now);
        stream.flow_rate = new_flow_rate;
    }

    pub fn stop_stream(&mut self, stream_id: u64) {
        let state = StreamCoreState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.sender == caller, "Only sender can stop stream");
        assert!(
            stream.status != StreamStatus::Stopped,
            "Stream already stopped"
        );

        StreamCoreState::settle(stream, now);
        stream.status = StreamStatus::Stopped;
        stream.flow_rate = 0;
        state.active_count = state.active_count.saturating_sub(1);
    }

    pub fn pause_stream(&mut self, stream_id: u64) {
        let state = StreamCoreState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.sender == caller, "Only sender can pause stream");
        assert!(stream.status == StreamStatus::Active, "Stream is not active");

        StreamCoreState::settle(stream, now);
        stream.status = StreamStatus::Paused;
        state.active_count = state.active_count.saturating_sub(1);
    }

    pub fn resume_stream(&mut self, stream_id: u64) {
        let state = StreamCoreState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.sender == caller, "Only sender can resume stream");
        assert!(
            stream.status == StreamStatus::Paused,
            "Stream is not paused"
        );

        stream.last_update = now;
        stream.status = StreamStatus::Active;
        state.active_count += 1;
    }

    pub fn deposit(&mut self, stream_id: u64, amount: u128) {
        let state = StreamCoreState::get();
        let caller = msg::source();

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.sender == caller, "Only sender can deposit");
        assert!(
            stream.status != StreamStatus::Stopped,
            "Cannot deposit to a stopped stream"
        );
        assert!(amount > 0, "Deposit amount must be > 0");

        stream.deposited = stream.deposited.saturating_add(amount);
    }

    pub fn withdraw(&mut self, stream_id: u64) -> u128 {
        let state = StreamCoreState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(stream.receiver == caller, "Only receiver can withdraw");

        StreamCoreState::settle(stream, now);

        let withdrawable = stream
            .streamed
            .min(stream.deposited)
            .saturating_sub(stream.withdrawn);
        assert!(withdrawable > 0, "Nothing to withdraw");

        let payload = encode_call(
            "VaultService",
            "TransferToReceiver",
            (stream.token, stream.receiver, withdrawable, stream_id)
        );
        gstd_msg::send_bytes_with_gas(
            state.config.token_vault,
            payload,
            5_000_000_000,
            0
        ).expect("Vault transfer failed");

        stream.withdrawn = stream.withdrawn.saturating_add(withdrawable);

        withdrawable
    }

    pub fn liquidate(&mut self, stream_id: u64) {
        let state = StreamCoreState::get();
        let now = exec::block_timestamp() / 1000;
        let min_buffer_seconds = state.config.min_buffer_seconds;

        let stream = state.streams.get_mut(&stream_id).expect("Stream not found");

        assert!(
            StreamCoreState::should_liquidate(stream, now, min_buffer_seconds),
            "Stream is not eligible for liquidation"
        );

        StreamCoreState::settle(stream, now);
        stream.status = StreamStatus::Paused;
        state.active_count = state.active_count.saturating_sub(1);
    }

    // ---- Queries ----

    pub fn get_stream(&self, stream_id: u64) -> Option<Stream> {
        let state = StreamCoreState::get();
        state.streams.get(&stream_id).cloned()
    }

    pub fn get_withdrawable_balance(&self, stream_id: u64) -> u128 {
        let state = StreamCoreState::get();
        let now = exec::block_timestamp() / 1000;
        state
            .streams
            .get(&stream_id)
            .map(|s| StreamCoreState::withdrawable_balance(s, now))
            .unwrap_or(0)
    }

    pub fn get_remaining_buffer(&self, stream_id: u64) -> u128 {
        let state = StreamCoreState::get();
        let now = exec::block_timestamp() / 1000;
        state
            .streams
            .get(&stream_id)
            .map(|s| StreamCoreState::remaining_buffer(s, now))
            .unwrap_or(0)
    }

    pub fn get_sender_streams(&self, sender: ActorId) -> Vec<u64> {
        let state = StreamCoreState::get();
        state
            .sender_streams
            .get(&sender)
            .cloned()
            .unwrap_or_default()
    }

    pub fn get_receiver_streams(&self, receiver: ActorId) -> Vec<u64> {
        let state = StreamCoreState::get();
        state
            .receiver_streams
            .get(&receiver)
            .cloned()
            .unwrap_or_default()
    }

    pub fn total_streams(&self) -> u64 {
        let state = StreamCoreState::get();
        state.streams.len() as u64
    }

    pub fn active_streams(&self) -> u64 {
        let state = StreamCoreState::get();
        state.active_count
    }

    pub fn get_config(&self) -> Config {
        let state = StreamCoreState::get();
        state.config.clone()
    }

    pub fn set_token_vault(&mut self, vault: ActorId) {
        let state = StreamCoreState::get();
        assert!(msg::source() == state.config.admin, "Only admin can set token_vault");
        state.config.token_vault = vault;
    }
}
