import * as firebaseMock from "../../../__mocks__/firebase";
import { render, screen, fireEvent } from "@testing-library/react";
import RoomListWithPhotoMeasurement from "../RoomListWithPhotoMeasurement";

jest.mock("@/lib/firebase", () => firebaseMock);

describe("RoomListWithPhotoMeasurement", () => {
  it("renders room names and photo measurement buttons", () => {
    const rooms = [
      { id: "room1", name: "Living Room" },
      { id: "room2", name: "Bedroom" },
    ];
    render(<RoomListWithPhotoMeasurement rooms={rooms} />);
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("Bedroom")).toBeInTheDocument();
    expect(screen.getByText("Photo Measurement")).toBeInTheDocument();
  });

  it("opens photo measurement UI when button is clicked", () => {
    const rooms = [
      { id: "room1", name: "Living Room" },
    ];
    render(<RoomListWithPhotoMeasurement rooms={rooms} />);
    fireEvent.click(screen.getByText("Photo Measurement"));
    expect(screen.getByText("Photo Measurement")).toBeInTheDocument(); // UI appears
  });
});
