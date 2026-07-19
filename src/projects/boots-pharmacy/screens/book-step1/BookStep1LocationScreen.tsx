import locationsMapChosen from "@/assets/locations-map-chosen.png";
import iconSearch from "@/assets/avail/search.svg";
import iconMapPin from "@/assets/avail/map-pin.svg";
import { ButtonPrimary } from "@/uxds/components";
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
  FilterChip,
  FilterChipGroup,
  FilterChipRow,
} from "@/uxds/interactions";
import type { RecipientMode } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { recipientModeLabel } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import {
  BOOK_STEP1_CHOSEN_SLOT_CLASS,
  BOOK_STEP1_REACT_SCREEN_ID,
} from "./bookStep1Contract";
import "./book-step1-location.css";

const BOOSTER_LABEL = "Include booking booster dose at a future date";

export type BookStep1ChosenLocation = {
  name: string;
  address: string;
  storeId?: string;
};

export type BookStep1LocationScreenProps = {
  chosenLocation: BookStep1ChosenLocation | null;
  vaccineName: string;
  recipient: RecipientMode;
  includeBoosterDose: boolean;
  onOpenSearch: () => void;
  onOpenNearMe: () => void;
  onChangeLocation: () => void;
  onChangeVaccine: () => void;
  onChangeRecipient: () => void;
  onToggleBooster: () => void;
  onContinue: () => void;
};

const PROGRESS_STEPS = [
  { n: 1, label: "Choose Location", active: true },
  { n: 2, label: "Choose Date and Time", active: false },
  { n: 3, label: "Confirmation", active: false },
] as const;

function EditGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="#afccca"
        fillRule="evenodd"
        d="M11.7 1.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-9.2 9.2H2.1v-3.4l9.6-9.8Zm.7 1.4L3.5 11.6v1h1l8.9-8.9-1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Make Book Step 1 checkmark (`element. gse. checkbox. check mark`) */
function CheckboxCheckMark() {
  return (
    <span
      className="book-step1__checkbox-mark"
      data-name="element. gse. checkbox. check mark"
      aria-hidden
    >
      <svg width="14" height="10" viewBox="0 0 13.4079 10.1151" fill="none">
        <path
          fill="#305854"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 5.49077L1.40162 4.06407L4.69457 7.29914L11.9937 0L13.4079 1.41421L4.70705 10.1151L0 5.49077Z"
        />
      </svg>
    </span>
  );
}

function SummaryPill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <div className="book-step1__pill" data-name="Week Schedule">
      <p className="book-step1__pill-label">{label}</p>
      <p className="book-step1__pill-value">{value}</p>
      <button
        type="button"
        className="book-step1__pill-change"
        data-name="component.input.button"
        onClick={onChange}
      >
        <EditGlyph />
        <span>Change</span>
      </button>
    </div>
  );
}

function BookProgress() {
  return (
    <div
      className="book-step1__progress"
      data-name="component.book.appointment.progress"
    >
      {PROGRESS_STEPS.map((step) => (
        <div
          key={step.n}
          className={
            step.active
              ? "book-step1__progress-step is-active"
              : "book-step1__progress-step"
          }
          {...(step.active
            ? { "data-proto-step-active": "true" as const }
            : {})}
        >
          <ol start={step.n}>
            <li>
              <span>{step.label}</span>
            </li>
          </ol>
          <div
            className="book-step1__progress-bar"
            data-proto-book-progress={step.active ? "current" : "upcoming"}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * React + UXDS pilot for Book — Step 1 (Location).
 * Retires Make HTML for this screen only; Studio wiring preserved via data-name.
 */
export function BookStep1LocationScreen({
  chosenLocation,
  vaccineName,
  recipient,
  includeBoosterDose,
  onOpenSearch,
  onOpenNearMe,
  onChangeLocation,
  onChangeVaccine,
  onChangeRecipient,
  onToggleBooster,
  onContinue,
}: BookStep1LocationScreenProps) {
  return (
    <div
      className="book-step1"
      data-name="body"
      data-proto-react-screen={BOOK_STEP1_REACT_SCREEN_ID}
    >
      <div className="book-step1__crumbs" data-name="module.breadcrumbs">
        <nav
          className="book-step1__crumbs-inner"
          data-name="component.breadcrumbs"
          aria-label="Breadcrumb"
        >
          <button type="button" className="book-step1__crumb-link">
            Home
          </button>
          <span className="book-step1__crumb-sep" aria-hidden>
            /
          </span>
          <span className="book-step1__crumb-current">Book Appointment</span>
        </nav>
      </div>

      <div className="book-step1__main">
        <h1 className="book-step1__title">Book Appointment</h1>
        <BookProgress />

        <section className="book-step1__card" aria-labelledby="book-step1-location">
          <div className="book-step1__pill-stack">
            <SummaryPill
              label="Vaccine"
              value={vaccineName}
              onChange={onChangeVaccine}
            />
            <SummaryPill
              label="Recipient"
              value={recipientModeLabel(recipient)}
              onChange={onChangeRecipient}
            />
          </div>

          <h2 id="book-step1-location" className="book-step1__section-title">
            Location
          </h2>

          <div data-name="chosen location" className="book-step1__location">
            {!chosenLocation ? (
              <>
                <button
                  type="button"
                  className="book-step1__search"
                  data-name="component.input.field"
                  onClick={onOpenSearch}
                >
                  <span data-name="Text Field" className="book-step1__search-text">
                    <p>Search for City, Postcode, Location...</p>
                  </span>
                  <img src={iconSearch} alt="" width={22} height={22} />
                </button>

                <div className="book-step1__near-me">
                  <FilterChipGroup mode="single">
                    {({ isSelected, toggle }) => (
                      <FilterChipRow>
                        <FilterChip
                          id="near-me"
                          selected={isSelected("near-me")}
                          onToggle={(id) => {
                            toggle(id);
                            onOpenNearMe();
                          }}
                          data-name="component.input.button"
                        >
                          <img src={iconMapPin} alt="" width={16} height={16} />
                          See what&apos;s available near me
                        </FilterChip>
                      </FilterChipRow>
                    )}
                  </FilterChipGroup>
                </div>
              </>
            ) : (
              <div className={`${BOOK_STEP1_CHOSEN_SLOT_CLASS} book-step1__chosen`}>
                <div className="book-step1__map" data-name="image 61">
                  <img
                    className="proto-chosen-map-bg"
                    src={locationsMapChosen}
                    alt={`Map showing ${chosenLocation.name}`}
                  />
                </div>
                <div
                  className="book-step1__store"
                  data-name="boots-pharmacy.store"
                >
                  <div>
                    <p className="book-step1__store-name">{chosenLocation.name}</p>
                    <p className="book-step1__store-address">
                      {chosenLocation.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="book-step1__pill-change"
                    data-name="component.input.button"
                    data-proto-change-loc="true"
                    onClick={onChangeLocation}
                  >
                    <EditGlyph />
                    <span>Change location</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="book-step1__booster" data-name="units">
            <label
              className="book-step1__checkbox-row"
              data-name="component.input.checkbox"
              data-proto-booster="true"
              data-proto-react-owned="true"
              data-checkbox-checked={String(includeBoosterDose)}
            >
              <span
                className="book-step1__checkbox-icon"
                data-name="icon / input / checkbox"
              >
                <span className="book-step1__checkbox-box" data-name="box">
                  {includeBoosterDose ? <CheckboxCheckMark /> : null}
                </span>
                <input
                  type="checkbox"
                  className="book-step1__checkbox-input"
                  checked={includeBoosterDose}
                  onChange={onToggleBooster}
                  aria-label={BOOSTER_LABEL}
                />
              </span>
              <span data-name="Label">
                <p>{BOOSTER_LABEL}</p>
              </span>
            </label>
            <Disclosure defaultOpen={false} className="book-step1__booster-more">
              {({ open, toggle }) => (
                <>
                  <DisclosureTrigger
                    open={open}
                    onToggle={toggle}
                    className="book-step1__learn-more"
                  >
                    Learn more
                  </DisclosureTrigger>
                  <DisclosureContent open={open} className="book-step1__learn-body">
                    Automatically schedules or reminds you about your follow-up
                    shot so you don&apos;t miss your window.
                  </DisclosureContent>
                </>
              )}
            </Disclosure>
          </div>

          <div className="book-step1__cta-wrap">
            <ButtonPrimary
              className="book-step1__continue"
              onClick={onContinue}
            >
              Continue
            </ButtonPrimary>
          </div>
        </section>

        <aside
          className="book-step1__help"
          data-name="component.errors.footer"
        >
          <p>
            Speak to our dedicated customer service team on{" "}
            <a href="tel:03451253752">0345 125 3752</a>
          </p>
          <p>
            We&apos;re here for you
            <br />
            Mon-Fri: 8:30am - 6:30pm, Sat: 8:45am – 5pm, Sun: 10am - 5pm
          </p>
        </aside>
      </div>
    </div>
  );
}
