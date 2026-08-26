import SchemeCard from "./SchemeCard";

function SchemeGrid({ schemes, onSelect }) {
  if (!schemes || schemes.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        No schemes available.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {schemes.map((scheme) => (
        <SchemeCard
          key={scheme.id}
          scheme={scheme}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default SchemeGrid;