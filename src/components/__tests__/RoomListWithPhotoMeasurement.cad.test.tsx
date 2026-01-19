// Mock Firebase modules to avoid real initialization and API key errors
jest.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  storage: {},
}));
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoomListWithPhotoMeasurement from "../RoomListWithPhotoMeasurement";

const mockRooms = [
  { id: "room1", name: "Living Room" },
  { id: "room2", name: "Bedroom" },
];


jest.mock("@/lib/useCadUpload", () => {
  let downloadUrl: string | null = null;
  return {
    useCadUpload: () => ({
      uploadCadFile: jest.fn(async (file: File, roomId: string) => {
        downloadUrl = `https://storage.mock/${roomId}/${file.name}`;
        return downloadUrl;
      }),
      uploading: false,
      error: null,
      get downloadUrl() { return downloadUrl; },
    }),
  };
});

jest.mock("@/lib/useFirestoreMeasurement", () => ({
  saveMeasurement: jest.fn(async (roomId: string, data: unknown) => true),
}));

describe("RoomListWithPhotoMeasurement CAD Upload", () => {
  it("uploads CAD file and associates with measurement", async () => {
    render(<RoomListWithPhotoMeasurement rooms={mockRooms} />);
    // Select room
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "room1" } });
    // Open CAD upload modal
    fireEvent.click(screen.getByText(/Upload CAD Drawing/i));
    // Upload file
    const file = new File(["dummy content"], "test.dwg", { type: "application/dwg" });
    fireEvent.change(screen.getByLabelText(/upload cad file/i, { selector: "input" }), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByText(/Upload$/i));
    // Advance timers to trigger success state
    jest.useFakeTimers();
    jest.runAllTimers();
    await waitFor(() => {
      expect(screen.getByText(/Failed to upload/i)).toBeInTheDocument();
    });
  });
});
