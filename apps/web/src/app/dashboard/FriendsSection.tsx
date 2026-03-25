import { IconUsers, IconPlus, IconIntersect } from "../../components/Icons";

type Friend = {
  id: string;
  steamId: string;
  displayName?: string | null;
};

type FriendsSectionProps = {
  friends: Friend[];
  friendSteamId: string;
  selectedFriendIds: string[];
  friendFilter: string;
  canUseSteam: boolean;
  canLoadShared: boolean;
  onSetFriendSteamId: (value: string) => void;
  onSetSelectedFriendIds: (updater: (prev: string[]) => string[]) => void;
  onSetFriendFilter: (value: string) => void;
  onFetchFriendList: () => void;
  onAddFriend: () => void;
  onDeleteFriend: (id: string) => void;
  onFetchSharedGames: () => void;
};

export default function FriendsSection({
  friends,
  friendSteamId,
  selectedFriendIds,
  friendFilter,
  canUseSteam,
  canLoadShared,
  onSetFriendSteamId,
  onSetSelectedFriendIds,
  onSetFriendFilter,
  onFetchFriendList,
  onAddFriend,
  onDeleteFriend,
  onFetchSharedGames,
}: FriendsSectionProps) {
  return (
    <section className="surface rounded-2xl p-6 card-animated animate-pop">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-white">Friends</h2>
          <p className="text-muted mt-2 text-sm">
            Load your Steam friends or add a Steam ID manually.
          </p>
        </div>
        <button
          id="btn-load-friends"
          className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onFetchFriendList}
          disabled={!canUseSteam}
        >
          <IconUsers className="h-4 w-4" />
          Load Steam Friends
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          className="w-full max-w-xs rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
          placeholder="Friend SteamID"
          value={friendSteamId}
          onChange={(event) => onSetFriendSteamId(event.target.value)}
          disabled={!canUseSteam}
        />
        <button
          className="btn-animated inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onAddFriend}
          disabled={!canUseSteam || friendSteamId.trim().length === 0}
        >
          <IconPlus className="h-4 w-4" />
          Save Friend
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <input
            placeholder="Search friends..."
            value={friendFilter}
            onChange={(e) => onSetFriendFilter(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <div
            id="friends-list"
            className="mt-2 h-44 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2"
          >
            {friends.length === 0 ? (
              <div className="text-sm text-muted p-2">
                No friends saved yet. Load Steam friends or add an ID.
              </div>
            ) : (
              friends
                .filter((f) => {
                  if (!friendFilter) return true;
                  const needle = friendFilter.toLowerCase();
                  return (
                    (f.displayName ?? "").toLowerCase().includes(needle) ||
                    f.steamId.toLowerCase().includes(needle)
                  );
                })
                .map((friend) => (
                  <div
                    key={friend.id}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                  >
                    <label className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFriendIds.includes(friend.id)}
                        onChange={() =>
                          onSetSelectedFriendIds((prev) =>
                            prev.includes(friend.id)
                              ? prev.filter((id) => id !== friend.id)
                              : [...prev, friend.id],
                          )
                        }
                        className="h-4 w-4"
                      />
                      <div className="truncate text-sm text-slate-200">
                        {friend.displayName ?? friend.steamId}
                      </div>
                    </label>
                    <button
                      className="flex-shrink-0 text-xs text-rose-300 hover:text-rose-200"
                      onClick={() => onDeleteFriend(friend.id)}
                      aria-label="Delete friend"
                      title="Delete friend"
                    >
                      Remove
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              className="btn-animated rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onSetSelectedFriendIds(() => friends.map((f) => f.id))}
              disabled={!canUseSteam || friends.length === 0}
            >
              Select All
            </button>
            <button
              className="btn-animated rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onSetSelectedFriendIds(() => [])}
              disabled={!canUseSteam || selectedFriendIds.length === 0}
            >
              Clear Selection
            </button>
          </div>
          <button
            id="btn-load-shared"
            className="btn-animated inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onFetchSharedGames}
            disabled={!canLoadShared}
          >
            <IconIntersect className="h-4 w-4" />
            Load Shared Games
          </button>
          <p className="text-xs text-muted">
            Select friends first to find shared games.
          </p>
        </div>
      </div>
    </section>
  );
}
