#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::msg,
    prelude::*,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct TokenMeta {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u128,
    pub admin: ActorId,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

static mut STATE: Option<GrowTokenState> = None;

pub struct GrowTokenState {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u128,
    pub admin: ActorId,
    pub balances: BTreeMap<ActorId, u128>,
    pub allowances: BTreeMap<(ActorId, ActorId), u128>,
}

impl GrowTokenState {
    fn new(admin: ActorId, initial_supply: u128) -> Self {
        let mut balances = BTreeMap::new();
        if initial_supply > 0 {
            balances.insert(admin, initial_supply);
        }
        Self {
            name: String::from("GrowStreams Token"),
            symbol: String::from("GROW"),
            decimals: 12,
            total_supply: initial_supply,
            admin,
            balances,
            allowances: BTreeMap::new(),
        }
    }

    fn get() -> &'static mut Self {
        unsafe { STATE.as_mut().expect("State not initialized") }
    }

    fn balance_of(&self, account: &ActorId) -> u128 {
        self.balances.get(account).copied().unwrap_or(0)
    }

    fn allowance_of(&self, owner: &ActorId, spender: &ActorId) -> u128 {
        self.allowances.get(&(*owner, *spender)).copied().unwrap_or(0)
    }
}

// ---------------------------------------------------------------------------
// Program (constructor)
// ---------------------------------------------------------------------------

pub struct GrowTokenProgram;

#[program]
impl GrowTokenProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        let initial_supply: u128 = 1_000_000_000_000_000_000; // 1M GROW (12 decimals)
        unsafe {
            STATE = Some(GrowTokenState::new(admin, initial_supply));
        }
        Self
    }

    pub fn vft_service(&self) -> VftService {
        VftService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct VftService;

impl VftService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl VftService {
    // ---- Commands ----

    pub fn transfer(&mut self, to: ActorId, amount: u128) -> bool {
        let state = GrowTokenState::get();
        let from = msg::source();

        let from_balance = state.balance_of(&from);
        assert!(from_balance >= amount, "Insufficient balance");

        let entry_from = state.balances.entry(from).or_insert(0);
        *entry_from = entry_from.saturating_sub(amount);

        let entry_to = state.balances.entry(to).or_insert(0);
        *entry_to = entry_to.saturating_add(amount);

        true
    }

    pub fn approve(&mut self, spender: ActorId, amount: u128) -> bool {
        let state = GrowTokenState::get();
        let owner = msg::source();
        state.allowances.insert((owner, spender), amount);
        true
    }

    pub fn transfer_from(&mut self, from: ActorId, to: ActorId, amount: u128) -> bool {
        let state = GrowTokenState::get();
        let spender = msg::source();

        let from_balance = state.balance_of(&from);
        assert!(from_balance >= amount, "Insufficient balance");

        let current_allowance = state.allowance_of(&from, &spender);
        assert!(current_allowance >= amount, "Insufficient allowance");

        state.allowances.insert(
            (from, spender),
            current_allowance.saturating_sub(amount),
        );

        let entry_from = state.balances.entry(from).or_insert(0);
        *entry_from = entry_from.saturating_sub(amount);

        let entry_to = state.balances.entry(to).or_insert(0);
        *entry_to = entry_to.saturating_add(amount);

        true
    }

    pub fn mint(&mut self, to: ActorId, amount: u128) {
        let state = GrowTokenState::get();
        let caller = msg::source();
        assert!(caller == state.admin, "Only admin can mint");
        assert!(amount > 0, "Amount must be > 0");

        let entry = state.balances.entry(to).or_insert(0);
        *entry = entry.saturating_add(amount);
        state.total_supply = state.total_supply.saturating_add(amount);
    }

    pub fn burn(&mut self, amount: u128) {
        let state = GrowTokenState::get();
        let caller = msg::source();

        let balance = state.balance_of(&caller);
        assert!(balance >= amount, "Insufficient balance to burn");

        let entry = state.balances.entry(caller).or_insert(0);
        *entry = entry.saturating_sub(amount);
        state.total_supply = state.total_supply.saturating_sub(amount);
    }

    // ---- Queries ----

    pub fn balance_of(&self, account: ActorId) -> u128 {
        let state = GrowTokenState::get();
        state.balance_of(&account)
    }

    pub fn allowance(&self, owner: ActorId, spender: ActorId) -> u128 {
        let state = GrowTokenState::get();
        state.allowance_of(&owner, &spender)
    }

    pub fn total_supply(&self) -> u128 {
        let state = GrowTokenState::get();
        state.total_supply
    }

    pub fn name(&self) -> String {
        let state = GrowTokenState::get();
        state.name.clone()
    }

    pub fn symbol(&self) -> String {
        let state = GrowTokenState::get();
        state.symbol.clone()
    }

    pub fn decimals(&self) -> u8 {
        let state = GrowTokenState::get();
        state.decimals
    }

    pub fn get_meta(&self) -> TokenMeta {
        let state = GrowTokenState::get();
        TokenMeta {
            name: state.name.clone(),
            symbol: state.symbol.clone(),
            decimals: state.decimals,
            total_supply: state.total_supply,
            admin: state.admin,
        }
    }
}
