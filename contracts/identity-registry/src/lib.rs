#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct Binding {
    pub actor_id: ActorId,
    pub github_username_hash: [u8; 32],
    pub verified_at: u64,
    pub proof_hash: [u8; 32],
    pub score: u32,
    pub updated_at: u64,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct IdentityState {
    oracle: ActorId,
    bindings: BTreeMap<ActorId, Binding>,
    github_to_actor: BTreeMap<[u8; 32], ActorId>,
    total_bindings: u32,
}

impl IdentityState {
    fn new(oracle: ActorId) -> Self {
        Self {
            oracle,
            bindings: BTreeMap::new(),
            github_to_actor: BTreeMap::new(),
            total_bindings: 0,
        }
    }
}

static mut STATE: Option<IdentityState> = None;

fn state() -> &'static IdentityState {
    unsafe { STATE.as_ref().expect("State not initialized") }
}

fn state_mut() -> &'static mut IdentityState {
    unsafe { STATE.as_mut().expect("State not initialized") }
}

// Simple hash for github username (no_std compatible)
fn hash_username(username: &str) -> [u8; 32] {
    let bytes = username.as_bytes();
    let mut hash = [0u8; 32];
    for (i, &b) in bytes.iter().enumerate() {
        hash[i % 32] ^= b;
        // mix bits
        hash[(i + 1) % 32] = hash[(i + 1) % 32].wrapping_add(b.wrapping_mul(31));
    }
    hash
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

pub struct IdentityRegistryProgram;

#[program]
impl IdentityRegistryProgram {
    pub fn new() -> Self {
        let oracle = msg::source();
        unsafe {
            STATE = Some(IdentityState::new(oracle));
        }
        Self
    }

    pub fn identity_service(&self) -> IdentityService {
        IdentityService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct IdentityService;

impl IdentityService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl IdentityService {
    // --- Mutations ---

    pub fn create_binding(
        &mut self,
        actor: ActorId,
        github_username: String,
        proof_hash: Vec<u8>,
        score: u32,
    ) {
        let caller = msg::source();
        let s = state_mut();
        assert!(caller == s.oracle, "Only oracle can create bindings");
        assert!(!github_username.is_empty(), "Username cannot be empty");
        assert!(score <= 100, "Score must be 0-100");
        assert!(!s.bindings.contains_key(&actor), "Binding already exists for this actor");

        let gh_hash = hash_username(&github_username);

        assert!(
            !s.github_to_actor.contains_key(&gh_hash),
            "GitHub username already bound"
        );

        let mut proof = [0u8; 32];
        let len = proof_hash.len().min(32);
        proof[..len].copy_from_slice(&proof_hash[..len]);

        let now = exec::block_timestamp();
        let binding = Binding {
            actor_id: actor,
            github_username_hash: gh_hash,
            verified_at: now,
            proof_hash: proof,
            score,
            updated_at: now,
        };

        s.bindings.insert(actor, binding);
        s.github_to_actor.insert(gh_hash, actor);
        s.total_bindings += 1;
    }

    pub fn revoke_binding(&mut self, actor: ActorId) {
        let caller = msg::source();
        let s = state_mut();
        assert!(caller == s.oracle, "Only oracle can revoke bindings");

        let binding = s.bindings.remove(&actor).expect("No binding for this actor");
        s.github_to_actor.remove(&binding.github_username_hash);
        s.total_bindings = s.total_bindings.saturating_sub(1);
    }

    pub fn update_score(&mut self, actor: ActorId, new_score: u32) {
        let caller = msg::source();
        let s = state_mut();
        assert!(caller == s.oracle, "Only oracle can update scores");
        assert!(new_score <= 100, "Score must be 0-100");

        let binding = s.bindings.get_mut(&actor).expect("No binding for this actor");
        binding.score = new_score;
        binding.updated_at = exec::block_timestamp();
    }

    pub fn set_oracle(&mut self, new_oracle: ActorId) {
        let s = state_mut();
        assert!(msg::source() == s.oracle, "Only oracle can transfer ownership");
        s.oracle = new_oracle;
    }

    // --- Queries ---

    pub fn get_actor_by_github(&self, github_username: String) -> Option<ActorId> {
        let gh_hash = hash_username(&github_username);
        state().github_to_actor.get(&gh_hash).copied()
    }

    pub fn get_binding(&self, actor: ActorId) -> Option<Binding> {
        state().bindings.get(&actor).cloned()
    }

    pub fn oracle_address(&self) -> ActorId {
        state().oracle
    }

    pub fn total_bindings(&self) -> u32 {
        state().total_bindings
    }

    pub fn get_config(&self) -> (ActorId, u32) {
        let s = state();
        (s.oracle, s.total_bindings)
    }
}
