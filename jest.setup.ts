import "@testing-library/jest-dom";
import "whatwg-fetch";
jest.mock("next/navigation", () => require("./__mocks__/nextNavigation"));
// Polyfill browser APIs for jsdom
Object.defineProperty(global.URL, "createObjectURL", {
	value: jest.fn(() => "blob:mock"),
});
Object.defineProperty(global.URL, "revokeObjectURL", {
	value: jest.fn(),
});

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
(global as any).ResizeObserver = ResizeObserverMock;

class IntersectionObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
(global as any).IntersectionObserver = IntersectionObserverMock;
