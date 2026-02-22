#![no_std]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, Encode, Decode, TypeInfo, PartialEq, Eq, PartialOrd, Ord)]
pub enum PermissionScope {
    CreateStream,
    UpdateStream,
    StopStream,
    DepositOnBehalf,
    FullAccess,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct Permission {
    pub granter: ActorId,
    pub grantee: ActorId,
    pub scope: PermissionScope,
    pub granted_at: u64,
    pub expires_at: Option<u64>,
    pub active: bool,
}

// Composite key: (granter, grantee, scope)
type PermKey = (ActorId, ActorId, PermissionScope);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct PermissionState {
    admin: ActorId,
    stream_core: ActorId,
    permissions: BTreeMap<PermKey, Permission>,
    // Index: granter → list of keys
    by_granter: BTreeMap<ActorId, Vec<PermKey>>,
    // Index: grantee → list of keys
    by_grantee: BTreeMap<ActorId, Vec<PermKey>>,
}

impl PermissionState {
    fn new(admin: ActorId, stream_core: ActorId) -> Self {
        Self {
            admin,
            stream_core,
            permissions: BTreeMap::new(),
            by_granter: BTreeMap::new(),
            by_grantee: BTreeMap::new(),
        }
    }
}

static mut STATE: Option<PermissionState> = None;

fn state() -> &'static PermissionState {
    unsafe { STATE.as_ref().expect("State not initialized") }
}

fn state_mut() -> &'static mut PermissionState {
    unsafe { STATE.as_mut().expect("State not initialized") }
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

pub struct PermissionManagerProgram;

#[program]
impl PermissionManagerProgram {
    pub fn new() -> Self {
        let admin = msg::source();
        unsafe {
            STATE = Some(PermissionState::new(admin, ActorId::zero()));
        }
        Self
    }

    pub fn permission_service(&self) -> PermissionService {
        PermissionService
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

pub struct PermissionService;

impl PermissionService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl PermissionService {
    // --- Mutations ---

    pub fn grant_permission(
        &mut self,
        grantee: ActorId,
        scope: PermissionScope,
        expires_at: Option<u64>,
    ) {
        let granter = msg::source();
        assert!(granter != grantee, "Cannot grant permission to yourself");

        let now = exec::block_timestamp();
        if let Some(exp) = expires_at {
            assert!(exp > now, "Expiry must be in the future");
        }

        let s = state_mut();
        let key = (granter, grantee, scope);

        let perm = Permission {
            granter,
            grantee,
            scope,
            granted_at: now,
            expires_at,
            active: true,
        };

        // Insert or overwrite
        if !s.permissions.contains_key(&key) {
            s.by_granter.entry(granter).or_insert_with(Vec::new).push(key);
            s.by_grantee.entry(grantee).or_insert_with(Vec::new).push(key);
        }
        s.permissions.insert(key, perm);
    }

    pub fn revoke_permission(&mut self, grantee: ActorId, scope: PermissionScope) {
        let granter = msg::source();
        let s = state_mut();
        let key = (granter, grantee, scope);

        let perm = s.permissions.get_mut(&key).expect("Permission not found");
        assert!(perm.active, "Permission already revoked");
        perm.active = false;
    }

    pub fn revoke_all(&mut self, grantee: ActorId) {
        let granter = msg::source();
        let s = state_mut();

        if let Some(keys) = s.by_granter.get(&granter) {
            let matching: Vec<PermKey> = keys
                .iter()
                .filter(|(g, ge, _)| *g == granter && *ge == grantee)
                .cloned()
                .collect();
            for key in matching {
                if let Some(perm) = s.permissions.get_mut(&key) {
                    perm.active = false;
                }
            }
        }
    }

    pub fn set_stream_core(&mut self, stream_core: ActorId) {
        let s = state_mut();
        assert!(msg::source() == s.admin, "Only admin can set stream_core");
        s.stream_core = stream_core;
    }

    // --- Queries ---

    pub fn has_permission(
        &self,
        granter: ActorId,
        grantee: ActorId,
        scope: PermissionScope,
    ) -> bool {
        let s = state();
        // Check specific scope
        if let Some(perm) = s.permissions.get(&(granter, grantee, scope)) {
            if perm.active {
                if let Some(exp) = perm.expires_at {
                    if exec::block_timestamp() > exp {
                        return false;
                    }
                }
                return true;
            }
        }
        // Check FullAccess fallback
        if scope != PermissionScope::FullAccess {
            if let Some(perm) = s.permissions.get(&(granter, grantee, PermissionScope::FullAccess)) {
                if perm.active {
                    if let Some(exp) = perm.expires_at {
                        if exec::block_timestamp() > exp {
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
        false
    }

    pub fn get_permissions(&self, granter: ActorId) -> Vec<Permission> {
        let s = state();
        s.by_granter
            .get(&granter)
            .map(|keys| {
                keys.iter()
                    .filter_map(|k| s.permissions.get(k))
                    .filter(|p| p.active)
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn get_granted_permissions(&self, grantee: ActorId) -> Vec<Permission> {
        let s = state();
        s.by_grantee
            .get(&grantee)
            .map(|keys| {
                keys.iter()
                    .filter_map(|k| s.permissions.get(k))
                    .filter(|p| p.active)
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn get_config(&self) -> (ActorId, ActorId) {
        let s = state();
        (s.admin, s.stream_core)
    }

    pub fn total_permissions(&self) -> u64 {
        state().permissions.values().filter(|p| p.active).count() as u64
    }
}
