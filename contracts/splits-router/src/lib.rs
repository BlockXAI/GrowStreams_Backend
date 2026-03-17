#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

pub type GroupId = u64;

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct SplitRecipient {
    pub address: ActorId,
    pub weight: u32,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct SplitGroup {
    pub id: GroupId,
    pub owner: ActorId,
    pub recipients: Vec<SplitRecipient>,
    pub total_weight: u32,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct DistributionPreview {
    pub address: ActorId,
    pub amount: u128,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct SplitsState {
    admin: ActorId,
    next_group_id: GroupId,
    groups: BTreeMap<GroupId, SplitGroup>,
    owner_groups: BTreeMap<ActorId, Vec<GroupId>>,
    // Track distributed amounts per group for accounting
    distributed: BTreeMap<GroupId, u128>,
}

impl SplitsState {
    fn new(admin: ActorId) -> Self {
        Self {
            admin,
            next_group_id: 1,
            groups: BTreeMap::new(),
            owner_groups: BTreeMap::new(),
            distributed: BTreeMap::new(),
        }
    }
}

static mut STATE: Option<SplitsState> = None;

fn state() -> &'static SplitsState {
    unsafe { STATE.as_ref().expect("State not initialized") }
}

fn state_mut() -> &'static mut SplitsState {
    unsafe { STATE.as_mut().expect("State not initialized") }
}

// ---------------------------------------------------------------------------
// Program (constructor + service exposure)
// ---------------------------------------------------------------------------

pub struct SplitsRouterProgram;

#[program]
impl SplitsRouterProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        unsafe {
            STATE = Some(SplitsState::new(admin));
        }
        Self
    }

    pub fn splits_service(&self) -> SplitsService {
        SplitsService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct SplitsService;

impl SplitsService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl SplitsService {
    // --- Mutations ---

    pub fn create_split_group(&mut self, recipients: Vec<SplitRecipient>) -> GroupId {
        assert!(!recipients.is_empty(), "Recipients list cannot be empty");
        assert!(recipients.len() <= 100, "Too many recipients (max 100)");

        let total_weight: u32 = recipients.iter().map(|r| r.weight).sum();
        assert!(total_weight > 0, "Total weight must be greater than zero");

        let s = state_mut();
        let id = s.next_group_id;
        s.next_group_id += 1;

        let owner = msg::source();
        let now = exec::block_timestamp();

        let group = SplitGroup {
            id,
            owner,
            recipients,
            total_weight,
            created_at: now,
            updated_at: now,
        };

        s.groups.insert(id, group);
        s.owner_groups.entry(owner).or_insert_with(Vec::new).push(id);

        id
    }

    pub fn update_split_group(&mut self, group_id: GroupId, recipients: Vec<SplitRecipient>) {
        assert!(!recipients.is_empty(), "Recipients list cannot be empty");
        assert!(recipients.len() <= 100, "Too many recipients (max 100)");

        let total_weight: u32 = recipients.iter().map(|r| r.weight).sum();
        assert!(total_weight > 0, "Total weight must be greater than zero");

        let s = state_mut();
        let group = s.groups.get_mut(&group_id).expect("Group not found");
        assert!(group.owner == msg::source(), "Only the owner can update");

        group.recipients = recipients;
        group.total_weight = total_weight;
        group.updated_at = exec::block_timestamp();
    }

    pub fn delete_split_group(&mut self, group_id: GroupId) {
        let s = state_mut();
        let group = s.groups.get(&group_id).expect("Group not found");
        assert!(group.owner == msg::source(), "Only the owner can delete");

        let owner = group.owner;
        s.groups.remove(&group_id);

        if let Some(ids) = s.owner_groups.get_mut(&owner) {
            ids.retain(|&id| id != group_id);
        }
    }

    pub fn distribute(&mut self, group_id: GroupId, token: ActorId, amount: u128) {
        assert!(amount > 0, "Amount must be greater than zero");

        let caller = msg::source();
        let s = state_mut();
        let group = s.groups.get(&group_id).expect("Group not found");
        assert!(group.owner == caller, "Only the owner can distribute");

        // Record the distribution (actual token transfers would require cross-contract calls)
        let total = s.distributed.entry(group_id).or_insert(0);
        *total += amount;

        // In production, this would iterate recipients and call TokenVault
        // to transfer proportional amounts. For now we record the intent.
        let _ = token; // token used in cross-contract call
    }

    // --- Queries ---

    pub fn get_split_group(&self, group_id: GroupId) -> Option<SplitGroup> {
        state().groups.get(&group_id).cloned()
    }

    pub fn get_owner_groups(&self, owner: ActorId) -> Vec<GroupId> {
        state().owner_groups.get(&owner).cloned().unwrap_or_default()
    }

    pub fn preview_distribution(&self, group_id: GroupId, amount: u128) -> Vec<DistributionPreview> {
        let group = state().groups.get(&group_id).expect("Group not found");
        group
            .recipients
            .iter()
            .map(|r| {
                let share = (amount * r.weight as u128) / group.total_weight as u128;
                DistributionPreview {
                    address: r.address,
                    amount: share,
                }
            })
            .collect()
    }

    pub fn total_groups(&self) -> u64 {
        state().groups.len() as u64
    }

    pub fn get_config(&self) -> (ActorId, u64) {
        let s = state();
        (s.admin, s.next_group_id - 1)
    }

    pub fn get_total_distributed(&self, group_id: GroupId) -> u128 {
        state().distributed.get(&group_id).copied().unwrap_or(0)
    }
}
