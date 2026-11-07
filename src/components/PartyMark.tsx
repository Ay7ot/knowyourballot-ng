/** Party box as on the ballot paper: INEC's logo when we have it, the acronym always. */
export default function PartyMark({
  code,
  logo,
  name,
  size = "md",
}: {
  code: string;
  logo?: string | null;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "party-box party-box-sm" : "party-box";
  if (!logo)
    return (
      <span className={box} title={name ?? code}>
        {code}
      </span>
    );
  return (
    <span className="inline-flex flex-none flex-col items-center gap-1" title={name ?? code}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={`${name ?? code} logo`}
        width={52}
        height={52}
        loading="lazy"
        className={`${box} party-logo`}
      />
      <span className="mono text-[0.65rem] font-medium leading-none">{code}</span>
    </span>
  );
}
