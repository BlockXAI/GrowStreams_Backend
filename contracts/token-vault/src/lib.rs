#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::msg,
    prelude::*,
};
use gstd::msg as gstd_msg;

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

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct VaultBalance {
    pub owner: ActorId,
    pub token: ActorId,
    pub total_deposited: u128,
    pub total_allocated: u128,
    pub available: u128,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct VaultConfig {
    pub admin: ActorId,
    pub stream_core: ActorId,
    pub paused: bool,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

static mut STATE: Option<TokenVaultState> = None;

pub struct TokenVaultState {
    pub config: VaultConfig,
    pub balances: BTreeMap<(ActorId, ActorId), VaultBalance>,
    pub stream_allocations: BTreeMap<u64, u128>,
}

impl TokenVaultState {
    fn new(admin: ActorId, stream_core: ActorId) -> Self {
        Self {
            config: VaultConfig {
                admin,
                stream_core,
                paused: false,
            },
            balances: BTreeMap::new(),
            stream_allocations: BTreeMap::new(),
        }
    }

    fn get() -> &'static mut Self {
        unsafe { STATE.as_mut().expect("TokenVault state not initialized") }
    }

    fn get_or_create_balance(&mut self, owner: ActorId, token: ActorId) -> &mut VaultBalance {
        self.balances.entry((owner, token)).or_insert(VaultBalance {
            owner,
            token,
            total_deposited: 0,
            total_allocated: 0,
            available: 0,
        })
    }
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

pub struct TokenVaultProgram;

#[program]
impl TokenVaultProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        unsafe {
            STATE = Some(TokenVaultState::new(admin, ActorId::zero()));
        }
        Self
    }

    pub fn vault_service(&self) -> VaultService {
        VaultService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct VaultService;

impl VaultService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl VaultService {
    // ---- Commands ----

    pub fn deposit_tokens(&mut self, token: ActorId, amount: u128) {
        let state = TokenVaultState::get();
        assert!(!state.config.paused, "Vault is paused");
        assert!(amount > 0, "Amount must be > 0");
        assert!(token != ActorId::zero(), "Use deposit_native for VARA");

        let caller = msg::source();

        // Pull tokens from caller via VFT transfer_from(caller, vault, amount)
        let vault_id = gstd::exec::program_id();
        let payload = encode_call(
            "VftService",
            "TransferFrom",
            (caller, vault_id, amount),
        );
        gstd_msg::send_bytes_with_gas(token, payload, 5_000_000_000, 0)
            .expect("VFT transfer_from failed");

        let balance = state.get_or_create_balance(caller, token);
        balance.total_deposited = balance.total_deposited.saturating_add(amount);
        balance.available = balance.available.saturating_add(amount);
    }

    pub fn deposit_native(&mut self) {
        let state = TokenVaultState::get();
        assert!(!state.config.paused, "Vault is paused");
        
        let value = msg::value();
        assert!(value > 0, "Value must be > 0");
        
        let caller = msg::source();
        let token = ActorId::zero();
        let balance = state.get_or_create_balance(caller, token);
        balance.total_deposited = balance.total_deposited.saturating_add(value);
        balance.available = balance.available.saturating_add(value);
    }

    pub fn withdraw_tokens(&mut self, token: ActorId, amount: u128) {
        let state = TokenVaultState::get();
        assert!(!state.config.paused, "Vault is paused");
        assert!(token != ActorId::zero(), "Use withdraw_native for VARA");

        let caller = msg::source();
        let balance = state.get_or_create_balance(caller, token);
        assert!(balance.available >= amount, "Insufficient available balance");

        balance.available = balance.available.saturating_sub(amount);

        // Send tokens to caller via VFT transfer(caller, amount)
        let payload = encode_call(
            "VftService",
            "Transfer",
            (caller, amount),
        );
        gstd_msg::send_bytes_with_gas(token, payload, 5_000_000_000, 0)
            .expect("VFT transfer failed");
    }

    pub fn withdraw_native(&mut self, amount: u128) {
        let state = TokenVaultState::get();
        assert!(!state.config.paused, "Vault is paused");
        
        let caller = msg::source();
        let token = ActorId::zero();
        let balance = state.get_or_create_balance(caller, token);
        assert!(balance.available >= amount, "Insufficient available balance");
        
        balance.available = balance.available.saturating_sub(amount);
        msg::send(caller, b"", amount).expect("Failed to send native VARA");
    }

    pub fn allocate_to_stream(
        &mut self,
        owner: ActorId,
        token: ActorId,
        amount: u128,
        stream_id: u64,
    ) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(
            caller == state.config.stream_core,
            "Only StreamCore can allocate"
        );

        let balance = state.get_or_create_balance(owner, token);
        assert!(
            balance.available >= amount,
            "Insufficient available balance for allocation"
        );

        balance.available = balance.available.saturating_sub(amount);
        balance.total_allocated = balance.total_allocated.saturating_add(amount);

        let current = state.stream_allocations.entry(stream_id).or_insert(0);
        *current = current.saturating_add(amount);
    }

    pub fn release_from_stream(
        &mut self,
        owner: ActorId,
        token: ActorId,
        amount: u128,
        stream_id: u64,
    ) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(
            caller == state.config.stream_core,
            "Only StreamCore can release"
        );

        let alloc = state
            .stream_allocations
            .get_mut(&stream_id)
            .expect("No allocation found");
        assert!(*alloc >= amount, "Release amount exceeds allocation");
        *alloc = alloc.saturating_sub(amount);

        let balance = state.get_or_create_balance(owner, token);
        balance.total_allocated = balance.total_allocated.saturating_sub(amount);
        balance.available = balance.available.saturating_add(amount);
    }

    pub fn transfer_to_receiver(
        &mut self,
        token: ActorId,
        receiver: ActorId,
        amount: u128,
        stream_id: u64,
    ) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(
            caller == state.config.stream_core,
            "Only StreamCore can transfer to receiver"
        );

        let alloc = state
            .stream_allocations
            .get_mut(&stream_id)
            .expect("No allocation found");
        assert!(*alloc >= amount, "Transfer amount exceeds allocation");
        *alloc = alloc.saturating_sub(amount);

        if token == ActorId::zero() {
            msg::send(receiver, b"", amount).expect("Failed to send native VARA");
        } else {
            // Send tokens to receiver via VFT transfer(receiver, amount)
            let payload = encode_call(
                "VftService",
                "Transfer",
                (receiver, amount),
            );
            gstd_msg::send_bytes_with_gas(token, payload, 5_000_000_000, 0)
                .expect("VFT transfer to receiver failed");
        }
    }

    pub fn emergency_pause(&mut self) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(caller == state.config.admin, "Only admin can pause");
        state.config.paused = true;
    }

    pub fn emergency_unpause(&mut self) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(caller == state.config.admin, "Only admin can unpause");
        state.config.paused = false;
    }

    pub fn set_stream_core(&mut self, stream_core: ActorId) {
        let state = TokenVaultState::get();
        let caller = msg::source();
        assert!(caller == state.config.admin, "Only admin can set stream_core");
        state.config.stream_core = stream_core;
    }

    // ---- Queries ----

    pub fn get_balance(&self, owner: ActorId, token: ActorId) -> VaultBalance {
        let state = TokenVaultState::get();
        state
            .balances
            .get(&(owner, token))
            .cloned()
            .unwrap_or(VaultBalance {
                owner,
                token,
                total_deposited: 0,
                total_allocated: 0,
                available: 0,
            })
    }

    pub fn get_stream_allocation(&self, stream_id: u64) -> u128 {
        let state = TokenVaultState::get();
        state
            .stream_allocations
            .get(&stream_id)
            .copied()
            .unwrap_or(0)
    }

    pub fn is_paused(&self) -> bool {
        let state = TokenVaultState::get();
        state.config.paused
    }

    pub fn get_config(&self) -> VaultConfig {
        let state = TokenVaultState::get();
        state.config.clone()
    }
}
