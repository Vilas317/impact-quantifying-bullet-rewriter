import { useMemo, useState } from "react";
import {
  Check,
  GitBranch,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

const INITIAL_MASTER = [
  {
    id: "dashboard",
    text: "Developed a React dashboard for monitoring application activity.",
  },
  {
    id: "api",
    text: "Built REST APIs with Node.js and Express for application workflows.",
  },
  {
    id: "database",
    text: "Designed MongoDB data models and integrated database operations.",
  },
  {
    id: "testing",
    text: "Improved application reliability through validation and automated testing.",
  },
];

const INITIAL_ROLES = [
  {
    id: "fullstack",
    name: "Full Stack Developer",
    focus: "Balanced frontend and backend delivery",
  },
  {
    id: "backend",
    name: "Backend Developer",
    focus: "APIs, data and reliability",
  },
  {
    id: "frontend",
    name: "Frontend Developer",
    focus: "React interfaces and product experience",
  },
];

const createRoleState = (master) =>
  Object.fromEntries(
    INITIAL_ROLES.map((role) => [
      role.id,
      Object.fromEntries(
        master.map((bullet) => [
          bullet.id,
          {
            included: true,
            tailoring: "",
          },
        ]),
      ),
    ]),
  );

const createSnapshots = (master) =>
  Object.fromEntries(
    INITIAL_ROLES.map((role) => [
      role.id,
      Object.fromEntries(
        master.map((bullet) => [
          bullet.id,
          bullet.text,
        ]),
      ),
    ]),
  );

const RoleFamilyMatrix = () => {
  const [master, setMaster] = useState(INITIAL_MASTER);

  const [roles, setRoles] = useState(
    INITIAL_ROLES,
  );

  const [roleState, setRoleState] = useState(() =>
    createRoleState(INITIAL_MASTER),
  );

  const [snapshots, setSnapshots] = useState(() =>
    createSnapshots(INITIAL_MASTER),
  );

  const [selectedRoleId, setSelectedRoleId] =
    useState("fullstack");

  const [showMaster, setShowMaster] =
    useState(true);

  const [message, setMessage] = useState("");

  const selectedRole = roles.find(
    (role) => role.id === selectedRoleId,
  );

  /*
   * A role is considered out of sync when its
   * stored master snapshot differs from the
   * current master text.
   */
  const dirtyRoles = useMemo(() => {
    return roles.filter((role) =>
      master.some(
        (bullet) =>
          snapshots[role.id]?.[bullet.id] !==
          bullet.text,
      ),
    );
  }, [master, roles, snapshots]);

  const updateMasterBullet = (id, text) => {
    setMaster((current) =>
      current.map((bullet) =>
        bullet.id === id
          ? {
              ...bullet,
              text,
            }
          : bullet,
      ),
    );

    setMessage("");
  };

  const addMasterBullet = () => {
    const id = `bullet-${Date.now()}`;

    const newBullet = {
      id,
      text: "Add a new resume bullet.",
    };

    setMaster((current) => [
      ...current,
      newBullet,
    ]);

    setRoleState((current) => {
      const next = { ...current };

      for (const roleId of Object.keys(next)) {
        next[roleId] = {
          ...next[roleId],
          [id]: {
            included: true,
            tailoring: "",
          },
        };
      }

      return next;
    });

    setSnapshots((current) => {
      const next = { ...current };

      for (const roleId of Object.keys(next)) {
        next[roleId] = {
          ...next[roleId],
          [id]: newBullet.text,
        };
      }

      return next;
    });
  };

  const removeMasterBullet = (id) => {
    setMaster((current) =>
      current.filter(
        (bullet) => bullet.id !== id,
      ),
    );

    setRoleState((current) => {
      const next = {};

      for (const [roleId, bullets] of Object.entries(
        current,
      )) {
        const roleBullets = {
          ...bullets,
        };

        delete roleBullets[id];

        next[roleId] = roleBullets;
      }

      return next;
    });

    setSnapshots((current) => {
      const next = {};

      for (const [roleId, bullets] of Object.entries(
        current,
      )) {
        const roleSnapshots = {
          ...bullets,
        };

        delete roleSnapshots[id];

        next[roleId] = roleSnapshots;
      }

      return next;
    });
  };

  const updateRoleBullet = (
    roleId,
    bulletId,
    changes,
  ) => {
    setRoleState((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        [bulletId]: {
          ...current[roleId]?.[bulletId],
          ...changes,
        },
      },
    }));
  };

  /*
   * This is the central synchronization operation.
   *
   * It updates the master snapshot for every role.
   *
   * It deliberately does NOT modify:
   *   - included/excluded state
   *   - role-specific tailoring
   *
   * Therefore role customization survives sync.
   */
  const syncMaster = () => {
    setSnapshots(
      Object.fromEntries(
        roles.map((role) => [
          role.id,
          Object.fromEntries(
            master.map((bullet) => [
              bullet.id,
              bullet.text,
            ]),
          ),
        ]),
      ),
    );

    setMessage(
      `Master resume synced to ${roles.length} role variants. Role-specific tailoring was preserved.`,
    );
  };

  const addRole = () => {
    const id = `role-${Date.now()}`;

    const newRole = {
      id,
      name: "New Role Variant",
      focus: "Role-specific resume tailoring",
    };

    setRoles((current) => [
      ...current,
      newRole,
    ]);

    setRoleState((current) => ({
      ...current,
      [id]: Object.fromEntries(
        master.map((bullet) => [
          bullet.id,
          {
            included: true,
            tailoring: "",
          },
        ]),
      ),
    }));

    setSnapshots((current) => ({
      ...current,
      [id]: Object.fromEntries(
        master.map((bullet) => [
          bullet.id,
          bullet.text,
        ]),
      ),
    }));

    setSelectedRoleId(id);
    setShowMaster(false);
  };

  const removeRole = (roleId) => {
    if (roles.length === 1) {
      return;
    }

    setRoles((current) =>
      current.filter(
        (role) => role.id !== roleId,
      ),
    );

    setRoleState((current) => {
      const next = {
        ...current,
      };

      delete next[roleId];

      return next;
    });

    setSnapshots((current) => {
      const next = {
        ...current,
      };

      delete next[roleId];

      return next;
    });

    if (selectedRoleId === roleId) {
      const remainingRole = roles.find(
        (role) => role.id !== roleId,
      );

      setSelectedRoleId(
        remainingRole?.id || null,
      );
    }
  };

  const updateRoleMeta = (
    roleId,
    field,
    value,
  ) => {
    setRoles((current) =>
      current.map((role) =>
        role.id === roleId
          ? {
              ...role,
              [field]: value,
            }
          : role,
      ),
    );
  };

  const isRoleBulletDirty = (
    roleId,
    bulletId,
  ) => {
    return (
      snapshots[roleId]?.[bulletId] !==
      master.find(
        (bullet) => bullet.id === bulletId,
      )?.text
    );
  };

  return (
    <section className="role-matrix">
      <div className="role-matrix-header">
        <div>
          <div className="role-matrix-kicker">
            ROLE-FAMILY RESUME MATRIX
          </div>

          <h2>
            One master resume.
            <br />
            Multiple tailored versions.
          </h2>

          <p>
            Keep role-specific resumes synchronized
            with one source of truth without losing
            the customization for each role.
          </p>
        </div>

        <div className="role-matrix-status">
          <ShieldCheck size={15} />

          {dirtyRoles.length === 0
            ? "All variants synced"
            : `${dirtyRoles.length} variant${
                dirtyRoles.length === 1
                  ? ""
                  : "s"
              } need sync`}
        </div>
      </div>

      <div className="role-matrix-toolbar">
        <div>
          <span>MASTER SYNC</span>

          <strong>
            Changes to the master are detected
            automatically.
          </strong>
        </div>

        <button
          type="button"
          className="role-matrix-primary"
          onClick={syncMaster}
        >
          <RefreshCw size={15} />

          Sync master to all roles
        </button>
      </div>

      {message && (
        <div className="role-matrix-success">
          <Check size={15} />

          {message}
        </div>
      )}

      <div className="role-matrix-layout">
        <aside className="role-matrix-sidebar">
          <button
            type="button"
            className={
              showMaster
                ? "role-matrix-nav active"
                : "role-matrix-nav"
            }
            onClick={() =>
              setShowMaster(true)
            }
          >
            <GitBranch size={15} />

            <span>
              <small>MASTER</small>
              <strong>Base Resume</strong>
            </span>
          </button>

          <div className="role-matrix-section-label">
            ROLE VARIANTS
          </div>

          {roles.map((role) => (
            <button
              type="button"
              key={role.id}
              className={
                !showMaster &&
                selectedRoleId === role.id
                  ? "role-matrix-nav active"
                  : "role-matrix-nav"
              }
              onClick={() => {
                setSelectedRoleId(role.id);
                setShowMaster(false);
              }}
            >
              <span className="role-matrix-dot" />

              <span>
                <strong>{role.name}</strong>

                <small>
                  {role.focus}
                </small>
              </span>
            </button>
          ))}

          <button
            type="button"
            className="role-matrix-add"
            onClick={addRole}
          >
            <Plus size={15} />

            Add role variant
          </button>
        </aside>

        <div className="role-matrix-content">
          {showMaster ? (
            <div className="role-matrix-card">
              <div className="role-matrix-card-heading">
                <div>
                  <span>
                    SOURCE OF TRUTH
                  </span>

                  <h3>Master Resume</h3>

                  <p>
                    Edit your canonical resume
                    here. Role variants inherit
                    these source bullets.
                  </p>
                </div>

                <div className="role-matrix-canonical">
                  <ShieldCheck size={13} />
                  Canonical
                </div>
              </div>

              <div className="role-matrix-bullets">
                {master.map(
                  (bullet, index) => (
                    <div
                      className="role-matrix-master-row"
                      key={bullet.id}
                    >
                      <span>
                        {String(
                          index + 1,
                        ).padStart(2, "0")}
                      </span>

                      <textarea
                        value={bullet.text}
                        onChange={(event) =>
                          updateMasterBullet(
                            bullet.id,
                            event.target.value,
                          )
                        }
                      />

                      <button
                        type="button"
                        className="role-matrix-icon"
                        onClick={() =>
                          removeMasterBullet(
                            bullet.id,
                          )
                        }
                        title="Remove bullet"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                className="role-matrix-add"
                onClick={addMasterBullet}
              >
                <Plus size={15} />

                Add master bullet
              </button>
            </div>
          ) : (
            <div className="role-matrix-card">
              {selectedRole && (
                <>
                  <div className="role-matrix-card-heading">
                    <div>
                      <span>
                        TAILORED VARIANT
                      </span>

                      <input
                        className="role-matrix-title"
                        value={
                          selectedRole.name
                        }
                        onChange={(event) =>
                          updateRoleMeta(
                            selectedRole.id,
                            "name",
                            event.target.value,
                          )
                        }
                      />

                      <input
                        className="role-matrix-focus"
                        value={
                          selectedRole.focus
                        }
                        onChange={(event) =>
                          updateRoleMeta(
                            selectedRole.id,
                            "focus",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="role-matrix-delete-role"
                      onClick={() =>
                        removeRole(
                          selectedRole.id,
                        )
                      }
                      disabled={
                        roles.length === 1
                      }
                    >
                      <Trash2 size={14} />

                      Remove role
                    </button>
                  </div>

                  <div className="role-matrix-info">
                    <GitBranch size={15} />

                    Master text is the source.
                    Role-specific tailoring stays
                    local to this variant.
                  </div>

                  <div className="role-matrix-variant-list">
                    {master.map((bullet) => {
                      const state =
                        roleState[
                          selectedRole.id
                        ]?.[bullet.id] || {
                          included: true,
                          tailoring: "",
                        };

                      const dirty =
                        isRoleBulletDirty(
                          selectedRole.id,
                          bullet.id,
                        );

                      return (
                        <article
                          className={
                            state.included
                              ? "role-matrix-variant"
                              : "role-matrix-variant disabled"
                          }
                          key={bullet.id}
                        >
                          <div className="role-matrix-variant-header">
                            <label>
                              <input
                                type="checkbox"
                                checked={
                                  state.included
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateRoleBullet(
                                    selectedRole.id,
                                    bullet.id,
                                    {
                                      included:
                                        event.target
                                          .checked,
                                    },
                                  )
                                }
                              />

                              Include in{" "}
                              {
                                selectedRole.name
                              }
                            </label>

                            {dirty && (
                              <span className="role-matrix-dirty">
                                Master changed
                              </span>
                            )}
                          </div>

                          <span className="role-matrix-label">
                            MASTER SOURCE
                          </span>

                          <p className="role-matrix-source">
                            {bullet.text}
                          </p>

                          {state.included && (
                            <>
                              <span className="role-matrix-label">
                                ROLE-SPECIFIC TAILORING
                              </span>

                              <textarea
                                className="role-matrix-tailoring"
                                value={
                                  state.tailoring
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateRoleBullet(
                                    selectedRole.id,
                                    bullet.id,
                                    {
                                      tailoring:
                                        event.target
                                          .value,
                                    },
                                  )
                                }
                                placeholder="Describe how this bullet should be emphasized for this role..."
                              />

                              <div className="role-matrix-preview">
                                <span>
                                  VARIANT PREVIEW
                                </span>

                                <p>
                                  {bullet.text}

                                  {state.tailoring
                                    ? ` ${state.tailoring}`
                                    : ""}
                                </p>
                              </div>
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RoleFamilyMatrix;