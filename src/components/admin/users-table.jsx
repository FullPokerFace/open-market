import { cn } from "@/lib/utils";
import { DeleteUser } from "./delete-user";
import { formatDate } from "./parts";

const cell = "border-r border-b px-4 py-3 align-top";

// The accounts on one page of /admin. `users`: from listUsers().
export function UsersTable({ users }) {
  if (!users.length) return <p className="m-0 px-6 py-5 text-[14px] text-body">No accounts yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-215 table-fixed border-collapse text-left text-[14px]">
        <thead className="eyebrow bg-tag text-muted-foreground">
          <tr>
            <th scope="col" className="border-r border-b px-4 py-3 font-medium">Email · name</th>
            <th scope="col" className="w-[14%] border-r border-b px-4 py-3 font-medium">Joined</th>
            <th scope="col" className="w-[14%] border-r border-b px-4 py-3 font-medium">Last seen</th>
            <th scope="col" className="w-[18%] border-r border-b px-4 py-3 font-medium">Watchlists</th>
            <th scope="col" className="w-[10%] border-r border-b px-4 py-3 font-medium">Notify</th>
            <th scope="col" className="w-[14%] border-b px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className={cell}>
                <a href={`mailto:${user.email}`} className="block truncate text-strong no-underline hover:text-blue">
                  {user.email}
                </a>
                <span className="eyebrow text-muted-foreground">
                  {user.name ?? "no name"}
                  {!user.emailVerified && <span className="text-miss"> · not verified</span>}
                </span>
              </td>
              <td className={cn(cell, "text-body")}>{user.createdAt ? formatDate(user.createdAt) : "—"}</td>
              <td className={cn(cell, "text-body")}>{user.lastSeenAt ? formatDate(user.lastSeenAt) : "—"}</td>
              <td className={cn(cell, "text-body")}>
                {user.lists ? (
                  <>
                    {user.lists} {user.lists === 1 ? "list" : "lists"} · {user.tickers} {user.tickers === 1 ? "ticker" : "tickers"}
                  </>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </td>
              <td className={cn(cell, user.notify ? "text-beat" : "text-muted-foreground")}>{user.notify ? "On" : "Off"}</td>
              <td className="border-b px-4 py-3 align-top">
                <DeleteUser id={user.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
