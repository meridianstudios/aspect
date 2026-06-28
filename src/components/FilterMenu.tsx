import Dropdown from "./Dropdown";
import { Funnel, Check } from "../lib/icons";
import type { TypeFilter } from "../lib/store";

const TYPES: [TypeFilter, string][] = [
  ["all", "All images"],
  ["photos", "Photos only"],
  ["raw", "RAW only"],
];

export default function FilterMenu({
  imagesOnly,
  onImagesOnly,
  typeFilter,
  onType,
  flaggedOnly,
  onFlaggedOnly,
}: {
  imagesOnly: boolean;
  onImagesOnly: () => void;
  typeFilter: TypeFilter;
  onType: (t: TypeFilter) => void;
  flaggedOnly?: boolean;
  onFlaggedOnly?: () => void;
}) {
  const active = !imagesOnly || typeFilter !== "all" || !!flaggedOnly;
  return (
    <Dropdown label="Filter" icon={<Funnel size={15} />} active={active}>
      <label className="menu-item menu-check">
        <input type="checkbox" checked={imagesOnly} onChange={onImagesOnly} />
        <span className={"menu-box" + (imagesOnly ? " on" : "")}>
          {imagesOnly && <Check size={12} />}
        </span>
        Images only
      </label>
      <div className="menu-sep" />
      <div className="menu-label">Type</div>
      {TYPES.map(([k, lbl]) => (
        <button
          key={k}
          className={"menu-item" + (typeFilter === k ? " on" : "")}
          onClick={() => onType(k)}
        >
          <span className="menu-box radio">
            {typeFilter === k && <span className="dot" />}
          </span>
          {lbl}
        </button>
      ))}
      {onFlaggedOnly && (
        <>
          <div className="menu-sep" />
          <label className="menu-item menu-check">
            <input
              type="checkbox"
              checked={!!flaggedOnly}
              onChange={onFlaggedOnly}
            />
            <span className={"menu-box" + (flaggedOnly ? " on" : "")}>
              {flaggedOnly && <Check size={12} />}
            </span>
            Flagged only
          </label>
        </>
      )}
    </Dropdown>
  );
}
