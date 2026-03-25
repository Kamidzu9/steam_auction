export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <section className="surface rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Privacy</h1>
        <p className="text-muted mt-2 text-sm">
          For the MVP we only store essential data: Steam ID, friend names/avatars,
          and pools. You can log in again at any time to refresh your data.
        </p>
      </section>
    </div>
  );
}
