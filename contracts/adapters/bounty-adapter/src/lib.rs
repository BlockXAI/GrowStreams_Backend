#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

pub type BountyId = u64;

#[derive(Debug, Clone, Copy, Encode, Decode, TypeInfo, PartialEq, Eq)]
pub enum BountyStatus {
    Open,
    Claimed,
    Streaming,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct Bounty {
    pub id: BountyId,
    pub creator: ActorId,
    pub title: String,
    pub token: ActorId,
    pub max_flow_rate: u128,
    pub min_score: u32,
    pub total_budget: u128,
    pub spent: u128,
    pub active_stream: Option<u64>,
    pub claimer: Option<ActorId>,
    pub status: BountyStatus,
    pub created_at: u64,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct BountyAdapterState {
    admin: ActorId,
    stream_core: ActorId,
    identity_registry: ActorId,
    next_bounty_id: BountyId,
    bounties: BTreeMap<BountyId, Bounty>,
    creator_bounties: BTreeMap<ActorId, Vec<BountyId>>,
    claimer_bounties: BTreeMap<ActorId, Vec<BountyId>>,
    open_bounties: Vec<BountyId>,
}

impl BountyAdapterState {
    fn new(admin: ActorId, stream_core: ActorId, identity_registry: ActorId) -> Self {
        Self {
            admin,
            stream_core,
            identity_registry,
            next_bounty_id: 1,
            bounties: BTreeMap::new(),
            creator_bounties: BTreeMap::new(),
            claimer_bounties: BTreeMap::new(),
            open_bounties: Vec::new(),
        }
    }
}

static mut STATE: Option<BountyAdapterState> = None;

fn state() -> &'static BountyAdapterState {
    unsafe { STATE.as_ref().expect("State not initialized") }
}

fn state_mut() -> &'static mut BountyAdapterState {
    unsafe { STATE.as_mut().expect("State not initialized") }
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

pub struct BountyAdapterProgram;

#[program]
impl BountyAdapterProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        unsafe {
            STATE = Some(BountyAdapterState::new(admin, ActorId::zero(), ActorId::zero()));
        }
        Self
    }

    pub fn bounty_service(&self) -> BountyService {
        BountyService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct BountyService;

impl BountyService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl BountyService {
    // --- Mutations ---

    pub fn create_bounty(
        &mut self,
        title: String,
        token: ActorId,
        max_flow_rate: u128,
        min_score: u32,
        total_budget: u128,
    ) -> BountyId {
        assert!(!title.is_empty(), "Title cannot be empty");
        assert!(max_flow_rate > 0, "Max flow rate must be > 0");
        assert!(total_budget > 0, "Budget must be > 0");
        assert!(min_score <= 100, "Score must be 0-100");

        let creator = msg::source();
        let s = state_mut();
        let id = s.next_bounty_id;
        s.next_bounty_id += 1;

        let bounty = Bounty {
            id,
            creator,
            title,
            token,
            max_flow_rate,
            min_score,
            total_budget,
            spent: 0,
            active_stream: None,
            claimer: None,
            status: BountyStatus::Open,
            created_at: exec::block_timestamp(),
        };

        s.bounties.insert(id, bounty);
        s.creator_bounties.entry(creator).or_insert_with(Vec::new).push(id);
        s.open_bounties.push(id);

        id
    }

    pub fn claim_bounty(&mut self, bounty_id: BountyId) {
        let claimer = msg::source();
        let s = state_mut();
        let bounty = s.bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert!(bounty.status == BountyStatus::Open, "Bounty is not open");

        bounty.claimer = Some(claimer);
        bounty.status = BountyStatus::Claimed;

        s.open_bounties.retain(|&id| id != bounty_id);
        s.claimer_bounties.entry(claimer).or_insert_with(Vec::new).push(bounty_id);
    }

    pub fn verify_and_start_stream(
        &mut self,
        bounty_id: BountyId,
        claimer: ActorId,
        score: u32,
    ) -> u64 {
        let caller = msg::source();
        let s = state_mut();

        // Only admin or the bounty creator can verify
        let bounty = s.bounties.get(&bounty_id).expect("Bounty not found");
        assert!(
            caller == s.admin || caller == bounty.creator,
            "Only admin or creator can verify"
        );
        assert!(bounty.status == BountyStatus::Claimed, "Bounty not in Claimed state");
        assert!(score >= bounty.min_score, "Score below minimum threshold");

        // Calculate flow rate proportional to score (score/100 * max_flow_rate)
        let flow_rate = (bounty.max_flow_rate * score as u128) / 100;
        assert!(flow_rate > 0, "Calculated flow rate is zero");

        // In production this would send a cross-contract message to StreamCore
        // to create a stream. For now we record the intent with a pseudo stream ID.
        let pseudo_stream_id = bounty_id; // maps 1:1 for simplicity

        let bounty = s.bounties.get_mut(&bounty_id).expect("Bounty not found");
        bounty.status = BountyStatus::Streaming;
        bounty.active_stream = Some(pseudo_stream_id);
        bounty.claimer = Some(claimer);

        pseudo_stream_id
    }

    pub fn adjust_stream(&mut self, bounty_id: BountyId, new_flow_rate: u128) {
        let caller = msg::source();
        let s = state_mut();
        let bounty = s.bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert!(
            caller == s.admin || caller == bounty.creator,
            "Only admin or creator can adjust"
        );
        assert!(bounty.status == BountyStatus::Streaming, "Bounty is not streaming");
        assert!(new_flow_rate > 0, "Flow rate must be > 0");
        assert!(new_flow_rate <= bounty.max_flow_rate, "Exceeds max flow rate");

        // In production: cross-contract call to StreamCore::UpdateStream
        let _ = new_flow_rate;
    }

    pub fn complete_bounty(&mut self, bounty_id: BountyId) {
        let caller = msg::source();
        let s = state_mut();
        let bounty = s.bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert!(
            caller == s.admin || caller == bounty.creator,
            "Only admin or creator can complete"
        );
        assert!(
            bounty.status == BountyStatus::Streaming || bounty.status == BountyStatus::Claimed,
            "Cannot complete bounty in current state"
        );

        // In production: cross-contract call to StreamCore::StopStream
        bounty.status = BountyStatus::Completed;
        bounty.active_stream = None;
    }

    pub fn cancel_bounty(&mut self, bounty_id: BountyId) {
        let caller = msg::source();
        let s = state_mut();
        let bounty = s.bounties.get_mut(&bounty_id).expect("Bounty not found");
        assert!(
            caller == s.admin || caller == bounty.creator,
            "Only admin or creator can cancel"
        );
        assert!(bounty.status != BountyStatus::Completed, "Already completed");
        assert!(bounty.status != BountyStatus::Cancelled, "Already cancelled");

        if bounty.status == BountyStatus::Open {
            s.open_bounties.retain(|&id| id != bounty_id);
        }
        bounty.status = BountyStatus::Cancelled;
        bounty.active_stream = None;
    }

    pub fn set_stream_core(&mut self, stream_core: ActorId) {
        let s = state_mut();
        assert!(msg::source() == s.admin, "Only admin");
        s.stream_core = stream_core;
    }

    pub fn set_identity_registry(&mut self, identity_registry: ActorId) {
        let s = state_mut();
        assert!(msg::source() == s.admin, "Only admin");
        s.identity_registry = identity_registry;
    }

    // --- Queries ---

    pub fn get_bounty(&self, bounty_id: BountyId) -> Option<Bounty> {
        state().bounties.get(&bounty_id).cloned()
    }

    pub fn get_open_bounties(&self) -> Vec<BountyId> {
        state().open_bounties.clone()
    }

    pub fn get_creator_bounties(&self, creator: ActorId) -> Vec<BountyId> {
        state().creator_bounties.get(&creator).cloned().unwrap_or_default()
    }

    pub fn get_claimer_bounties(&self, claimer: ActorId) -> Vec<BountyId> {
        state().claimer_bounties.get(&claimer).cloned().unwrap_or_default()
    }

    pub fn total_bounties(&self) -> u64 {
        state().bounties.len() as u64
    }

    pub fn get_config(&self) -> (ActorId, ActorId, ActorId) {
        let s = state();
        (s.admin, s.stream_core, s.identity_registry)
    }
}
