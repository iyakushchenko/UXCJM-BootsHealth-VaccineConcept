/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { findReserveAppointmentButton } from "@/projects/boots-pharmacy/playback/book";

describe("findReserveAppointmentButton", () => {
  it("prefers React reserve button over Make retired div", () => {
    const screen = document.createElement("div");
    const make = document.createElement("div");
    make.dataset.studioMakeRetired = "book-step-2";
    make.style.display = "none";
    const makeBtn = document.createElement("div");
    makeBtn.setAttribute("data-name", "component.input.button");
    makeBtn.textContent = "Reserve Appointment";
    make.appendChild(makeBtn);
    screen.appendChild(make);

    const reactBtn = document.createElement("button");
    reactBtn.setAttribute("data-studio-action", "book-step-2-reserve");
    reactBtn.className = "book-step-2__reserve";
    reactBtn.textContent = "Reserve Appointment";
    screen.appendChild(reactBtn);

    document.body.appendChild(screen);
    expect(findReserveAppointmentButton(screen)).toBe(reactBtn);
    screen.remove();
  });
});
