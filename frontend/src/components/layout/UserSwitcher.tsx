import type { UserSummary } from "../../hooks/useUsers";

interface UserSwitcherProps {
  users: UserSummary[];
  selectedUserId: string | undefined;
  onChange: (userId: string) => void;
}

export function UserSwitcher({ users, selectedUserId, onChange }: UserSwitcherProps) {
  if (users.length === 0) return null;

  return (
    <select
      value={selectedUserId ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
      aria-label="Active demo user"
    >
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
