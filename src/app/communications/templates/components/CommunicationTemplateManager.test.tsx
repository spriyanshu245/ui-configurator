import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import CommunicationTemplateManager from "@/app/communications/templates/components/CommunicationTemplateManager";
import {
  createNotificationSubscription,
  createNotificationTemplate,
  deleteNotificationSubscription,
  deleteNotificationTemplate,
  getChannels,
  getNotificationSubscriptions,
  getNotificationTemplates,
  getNotificationTypes,
  saveNotificationTemplateData,
  updateNotificationSubscription,
  updateNotificationTemplate,
} from "@/app/communications/templates/services";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetUserNotification = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

jest.mock("@/app/communications/templates/services", () => ({
  getChannels: jest.fn(),
  getNotificationTypes: jest.fn(),
  getNotificationSubscriptions: jest.fn(),
  getNotificationTemplates: jest.fn(),
  updateNotificationTemplate: jest.fn(),
  createNotificationSubscription: jest.fn(),
  updateNotificationSubscription: jest.fn(),
  deleteNotificationSubscription: jest.fn(),
  createNotificationTemplate: jest.fn(),
  deleteNotificationTemplate: jest.fn(),
  saveNotificationTemplateData: jest.fn(),
  toNotificationTemplatePayload: (template: unknown, primary: boolean) => ({
    ...(template as Record<string, unknown>),
    primary,
  }),
}));

jest.mock("@/app/components/SVGIcons/Plus", () => () => (
  <span data-testid="plus-icon">plus</span>
));
jest.mock("@/app/components/SVGIcons/Edit", () => () => (
  <span data-testid="edit-icon">edit</span>
));
jest.mock("@/app/components/SVGIcons/Delete", () => () => (
  <span data-testid="delete-icon">delete</span>
));
jest.mock("@/app/components/SVGIcons/ThreeDotMenu", () => () => (
  <span data-testid="three-dot-menu-icon">menu</span>
));
jest.mock("@/app/components/SVGIcons/ThreeDotMenuHorizontal", () => () => (
  <span data-testid="three-dot-menu-horizontal-icon">menu</span>
));
jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => {
    return function InlineLoaderMock({ id }: { id?: string }) {
      return <span data-testid={id}>loading</span>;
    };
  },
);

jest.mock(
  "@/app/components/InternalComponents/SelectDropdown/SelectDropdown",
  () => ({
    __esModule: true,
    default: ({
      id,
      value,
      onChange,
      options,
    }: {
      id?: string;
      value: string;
      onChange: (value: string) => void;
      options: Array<{ value: string; label: string }>;
    }) => (
      <select
        data-testid={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">--</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  }),
);

describe("CommunicationTemplateManager", () => {
  const templates = [
    {
      id: 1,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Welcome Email",
      subject: "Welcome",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    },
    {
      id: 2,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Primary Welcome",
      subject: "Welcome",
      templateMimeType: "text/html",
      language: "en",
      primary: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (getChannels as jest.Mock).mockResolvedValue([
      { code: "EMAIL", desc: "Email" },
    ]);
    (getNotificationTypes as jest.Mock).mockResolvedValue([
      { code: "WELCOME", description: "Welcome notification" },
      { code: "REGISTER", description: "Registration notification" },
    ]);
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      {
        subscriptionKey: "WELCOME_EMAIL",
        desc: "Welcome Email",
        notificationChannelCode: "EMAIL",
        notificationTypeCode: "WELCOME",
      },
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue(templates);
    (updateNotificationTemplate as jest.Mock).mockResolvedValue({
      ...templates[0],
      primary: true,
    });
    (deleteNotificationSubscription as jest.Mock).mockResolvedValue(null);
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  const mockWhatsAppSubscription = {
    subscriptionKey: "WELCOME_WHATSAPP",
    desc: "Welcome WhatsApp",
    notificationChannelCode: "WHATSAPP",
    notificationTypeCode: "WELCOME",
  };

  const mockSmsSubscription = {
    subscriptionKey: "WELCOME_SMS",
    desc: "Welcome SMS",
    notificationChannelCode: "SMS",
    notificationTypeCode: "WELCOME",
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads the three panes and opens a template in the communication designer route", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    expect(await screen.findByText("Welcome notification")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(await screen.findAllByText("WELCOME")).not.toHaveLength(0);
    expect(await screen.findAllByText("WELCOME_EMAIL")).not.toHaveLength(0);
    expect(await screen.findAllByText("Welcome Email")).not.toHaveLength(0);
    expect(screen.getAllByText("English")).not.toHaveLength(0);
    expect(screen.getAllByText("text/html")).not.toHaveLength(0);
    expect(screen.getByText("Primary")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Welcome Email")[1]);

    expect(screen.getByLabelText("Opening template")).toBeInTheDocument();
    expect(screen.getByTestId("opening-template-loader")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Actions for Welcome Email"),
    ).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith(
      "/communications/templates/1?type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
  });

  it("does not select the first notification type on initial page load", async () => {
    render(<CommunicationTemplateManager />);

    expect(await screen.findByText("Welcome notification")).toBeInTheDocument();
    expect(screen.getByText("Select a notification type.")).toBeInTheDocument();
    expect(screen.getByText("Select a subscription.")).toBeInTheDocument();
    expect(getNotificationSubscriptions).not.toHaveBeenCalled();
    expect(getNotificationTemplates).not.toHaveBeenCalled();
  });

  it("selects notification types without refetching static type and channel lists", async () => {
    render(<CommunicationTemplateManager />);

    await screen.findByText("Registration notification");
    expect(getNotificationTypes).toHaveBeenCalledTimes(1);
    expect(getChannels).toHaveBeenCalledTimes(1);
    expect(getNotificationSubscriptions).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Registration notification"));

    await waitFor(() => {
      expect(getNotificationSubscriptions).toHaveBeenCalledTimes(1);
    });
    expect(getNotificationSubscriptions).toHaveBeenLastCalledWith("REGISTER");
    expect(getNotificationTypes).toHaveBeenCalledTimes(1);
    expect(getChannels).toHaveBeenCalledTimes(1);
  });

  it("does not auto-select the first subscription when multiple subscriptions exist", async () => {
    mockSearchParams = new URLSearchParams("type=WELCOME");
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      {
        subscriptionKey: "WELCOME_EMAIL",
        desc: "Welcome Email",
        notificationChannelCode: "EMAIL",
        notificationTypeCode: "WELCOME",
      },
      {
        subscriptionKey: "WELCOME_SMS",
        desc: "Welcome SMS",
        notificationChannelCode: "SMS",
        notificationTypeCode: "WELCOME",
      },
    ]);

    render(<CommunicationTemplateManager />);

    expect(await screen.findByText("Welcome Email")).toBeInTheDocument();
    expect(screen.getByText("Select a subscription.")).toBeInTheDocument();
    expect(getNotificationSubscriptions).toHaveBeenCalledWith("WELCOME");
    expect(getNotificationTemplates).not.toHaveBeenCalled();
  });

  it("auto-selects the subscription when exactly one subscription exists", async () => {
    mockSearchParams = new URLSearchParams("type=WELCOME");
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      {
        subscriptionKey: "WELCOME_EMAIL",
        desc: "Welcome Email",
        notificationChannelCode: "EMAIL",
        notificationTypeCode: "WELCOME",
      },
    ]);

    render(<CommunicationTemplateManager />);

    expect(await screen.findAllByText("WELCOME_EMAIL")).not.toHaveLength(0);
    await waitFor(() => {
      expect(getNotificationTemplates).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
      );
    });
  });

  it("opens subscription actions from the overflow menu", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(await screen.findByText("Update Subscription")).toBeInTheDocument();
  });

  it("deletes a subscription from the overflow menu", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteNotificationSubscription).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
      );
    });
  });

  it("sets a template as primary without opening the designer", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Set as primary" }));

    await waitFor(() => {
      expect(updateNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        1,
        expect.objectContaining({ primary: true }),
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text: "Primary template updated",
      time: 2000,
    });
  });

  it("creates a subscription via the create pane", async () => {
    (createNotificationSubscription as jest.Mock).mockImplementation(
      async (_t, payload) => payload,
    );
    mockSearchParams = new URLSearchParams("type=WELCOME");
    render(<CommunicationTemplateManager />);

    await screen.findByText("Welcome notification");
    fireEvent.click(
      screen.getByRole("button", { name: "Create subscription" }),
    );

    fireEvent.change(screen.getByLabelText("Subscription Key*"), {
      target: { value: "WELCOME_SMS" },
    });
    fireEvent.change(screen.getByLabelText("Description*"), {
      target: { value: "Welcome SMS" },
    });
    fireEvent.change(screen.getByTestId("subscription-channel"), {
      target: { value: "EMAIL" },
    });

    const subPane = screen
      .getByText("Create Subscription")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(subPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationSubscription).toHaveBeenCalledWith(
        "WELCOME",
        expect.objectContaining({
          subscriptionKey: "WELCOME_SMS",
          desc: "Welcome SMS",
          notificationChannelCode: "EMAIL",
          notificationTypeCode: "WELCOME",
        }),
      );
    });
    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Subscription created" }),
    );
  });

  it("updates a subscription via the edit pane", async () => {
    (updateNotificationSubscription as jest.Mock).mockImplementation(
      async (_t, _k, payload) => payload,
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));

    fireEvent.change(screen.getByLabelText("Description*"), {
      target: { value: "Updated description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(updateNotificationSubscription).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        expect.objectContaining({ desc: "Updated description" }),
      );
    });
  });

  it("shows error feedback when subscription submit fails", async () => {
    (createNotificationSubscription as jest.Mock).mockRejectedValue(
      new Error("boom"),
    );
    mockSearchParams = new URLSearchParams("type=WELCOME");
    render(<CommunicationTemplateManager />);

    await screen.findByText("Welcome notification");
    fireEvent.click(
      screen.getByRole("button", { name: "Create subscription" }),
    );

    fireEvent.change(screen.getByLabelText("Subscription Key*"), {
      target: { value: "WELCOME_SMS" },
    });
    fireEvent.change(screen.getByLabelText("Description*"), {
      target: { value: "Welcome SMS" },
    });
    fireEvent.change(screen.getByTestId("subscription-channel"), {
      target: { value: "EMAIL" },
    });

    const subPane = screen
      .getByText("Create Subscription")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(subPane).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("boom")).toBeInTheDocument();
  });

  it("creates a template, saves default content and navigates to the designer", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 99,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "New Template",
      subject: "Hello",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    });
    (saveNotificationTemplateData as jest.Mock).mockResolvedValue("");
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("Welcome Email");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "New Template" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });
    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalled();
    });
    expect(saveNotificationTemplateData).toHaveBeenCalledWith(
      "WELCOME",
      "WELCOME_EMAIL",
      99,
      expect.stringContaining("<!DOCTYPE html>"),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/communications/templates/99?type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Template created" }),
    );
  });

  it("creates a WhatsApp template without saving content or navigating", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 199,
      subscriptionKey: "WELCOME_WHATSAPP",
      templateName: "WhatsApp Template",
      subject: "Hello",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    });
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      mockWhatsAppSubscription,
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue([]);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_WHATSAPP",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("WELCOME_WHATSAPP");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "WhatsApp Template" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Hello" },
    });

    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_WHATSAPP",
        expect.objectContaining({
          templateName: "WhatsApp Template",
        }),
      );
    });

    expect(saveNotificationTemplateData).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByText("WhatsApp Template")).toBeInTheDocument();
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text:
        "WhatsApp template metadata created. Template content is managed externally.",
      time: 2000,
    });
  });

  it("edits template metadata via the edit menu", async () => {
    (updateNotificationTemplate as jest.Mock).mockImplementation(
      async (_t, _k, id, payload) => ({
        ...payload,
        id,
        subscriptionKey: "WELCOME_EMAIL",
      }),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit metadata" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "Welcome Email Edited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(updateNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        1,
        expect.objectContaining({ templateName: "Welcome Email Edited" }),
      );
    });
    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Template updated" }),
    );
  });

  it("deletes a template via the menu and updates the list", async () => {
    (deleteNotificationTemplate as jest.Mock).mockResolvedValue(null);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        1,
      );
    });
    expect(mockSetUserNotification).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Template deleted" }),
    );
  });

  it("notifies on template delete failure", async () => {
    (deleteNotificationTemplate as jest.Mock).mockRejectedValue(
      new Error("nope"),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text: "nope" }),
      );
    });
  });

  it("notifies on subscription delete failure", async () => {
    (deleteNotificationSubscription as jest.Mock).mockRejectedValue(
      new Error("dnope"),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text: "dnope" }),
      );
    });
  });

  it("notifies on set primary failure", async () => {
    (updateNotificationTemplate as jest.Mock).mockRejectedValue(
      new Error("primary fail"),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Set as primary" }));

    await waitFor(() => {
      expect(mockSetUserNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", text: "primary fail" }),
      );
    });
  });

  it("aborts subscription delete when window.confirm returns false", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
    expect(deleteNotificationSubscription).not.toHaveBeenCalled();
  });

  it("aborts template delete when window.confirm returns false", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for Welcome Email"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
    expect(deleteNotificationTemplate).not.toHaveBeenCalled();
  });

  it("reloads templates when the same subscription is clicked again", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("WELCOME_EMAIL");
    expect(getNotificationTemplates).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByText("WELCOME_EMAIL")[0]);
    await waitFor(() => {
      expect(getNotificationTemplates).toHaveBeenCalledTimes(2);
    });
  });

  it("activates a subscription card via keyboard", async () => {
    mockSearchParams = new URLSearchParams("type=WELCOME");
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      {
        subscriptionKey: "WELCOME_EMAIL",
        desc: "Welcome Email",
        notificationChannelCode: "EMAIL",
        notificationTypeCode: "WELCOME",
      },
      {
        subscriptionKey: "WELCOME_SMS",
        desc: "Welcome SMS",
        notificationChannelCode: "SMS",
        notificationTypeCode: "WELCOME",
      },
    ]);
    render(<CommunicationTemplateManager />);

    const card = await screen.findByText("Welcome SMS");
    fireEvent.keyDown(card, { key: "Enter" });

    await waitFor(() => {
      expect(getNotificationTemplates).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_SMS",
      );
    });
  });

  it("activates a notification type card via keyboard", async () => {
    render(<CommunicationTemplateManager />);

    const node = await screen.findByText("Registration notification");
    fireEvent.keyDown(node, { key: " " });

    await waitFor(() => {
      expect(getNotificationSubscriptions).toHaveBeenLastCalledWith("REGISTER");
    });
  });

  it("activates a template card via keyboard to open designer", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await waitFor(() => {
      expect(screen.getAllByText("Welcome Email")).toHaveLength(2);
    });
    fireEvent.keyDown(screen.getAllByText("Welcome Email")[1], {
      key: "Enter",
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/communications/templates/1?type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
  });

  it("does not open the designer for WhatsApp templates on click", async () => {
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      mockWhatsAppSubscription,
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue([
      {
        id: 301,
        subscriptionKey: "WELCOME_WHATSAPP",
        templateName: "WhatsApp Existing Template",
        subject: "Hello",
        templateMimeType: "text/html",
        language: "en",
        primary: false,
      },
    ]);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_WHATSAPP",
    );
    render(<CommunicationTemplateManager />);

    const card = await screen.findByText("WhatsApp Existing Template");
    fireEvent.click(card);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Opening template")).not.toBeInTheDocument();
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "info",
      text:
        "WhatsApp templates are managed externally. The template designer is not available for this channel.",
      time: 3000,
    });
  });

  it("does not open the designer for WhatsApp templates on keyboard activation", async () => {
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      mockWhatsAppSubscription,
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue([
      {
        id: 302,
        subscriptionKey: "WELCOME_WHATSAPP",
        templateName: "WhatsApp Keyboard Template",
        subject: "Hello",
        templateMimeType: "text/html",
        language: "en",
        primary: false,
      },
    ]);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_WHATSAPP",
    );
    render(<CommunicationTemplateManager />);

    const card = await screen.findByText("WhatsApp Keyboard Template");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId("opening-template-loader")).not.toBeInTheDocument();
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "info",
      text:
        "WhatsApp templates are managed externally. The template designer is not available for this channel.",
      time: 3000,
    });
  });

  it("closes the open action menu on outside click and on Escape", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", { name: "Edit" }),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Actions for WELCOME_EMAIL"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", { name: "Edit" }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders a top-level error when initial data load fails", async () => {
    (getNotificationTypes as jest.Mock).mockRejectedValue(
      new Error("init fail"),
    );
    render(<CommunicationTemplateManager />);
    expect(await screen.findByText("init fail")).toBeInTheDocument();
  });

  it("renders subscription load error", async () => {
    (getNotificationSubscriptions as jest.Mock).mockRejectedValue(
      new Error("subs fail"),
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByText("Welcome notification"));
    expect(await screen.findByText("subs fail")).toBeInTheDocument();
  });

  it("renders template load error", async () => {
    (getNotificationTemplates as jest.Mock).mockRejectedValue(
      new Error("tmpl fail"),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    expect(await screen.findByText("tmpl fail")).toBeInTheDocument();
  });

  it("shows empty states for types, subscriptions and templates", async () => {
    (getNotificationTypes as jest.Mock).mockResolvedValue([]);
    render(<CommunicationTemplateManager />);
    expect(
      await screen.findByText("No notification types found."),
    ).toBeInTheDocument();
  });

  it("shows empty subscriptions when type has no subscriptions", async () => {
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([]);
    render(<CommunicationTemplateManager />);
    fireEvent.click(await screen.findByText("Welcome notification"));
    expect(
      await screen.findByText("No subscriptions found."),
    ).toBeInTheDocument();
  });

  it("shows empty templates when subscription has none", async () => {
    (getNotificationTemplates as jest.Mock).mockResolvedValue([]);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    expect(await screen.findByText("No templates found.")).toBeInTheDocument();
  });

  it("submits subscription form via native form submit", async () => {
    (createNotificationSubscription as jest.Mock).mockImplementation(
      async (_t, payload) => payload,
    );
    mockSearchParams = new URLSearchParams("type=WELCOME");
    render(<CommunicationTemplateManager />);

    await screen.findByText("Welcome notification");
    fireEvent.click(
      screen.getByRole("button", { name: "Create subscription" }),
    );

    fireEvent.change(screen.getByLabelText("Subscription Key*"), {
      target: { value: "WELCOME_SMS" },
    });
    fireEvent.change(screen.getByLabelText("Description*"), {
      target: { value: "Welcome SMS" },
    });
    fireEvent.change(screen.getByTestId("subscription-channel"), {
      target: { value: "EMAIL" },
    });

    const form = screen
      .getByLabelText("Subscription Key*")
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createNotificationSubscription).toHaveBeenCalled();
    });
  });

  it("shows vendorTemplateId for WhatsApp templates and includes it in the create payload", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 50,
      subscriptionKey: "WELCOME_WHATSAPP",
      templateName: "Test",
      subject: "",
      templateMimeType: "text/plain",
      language: "en",
      primary: false,
      vendorTemplateId: "VENDOR_XYZ",
    });
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      mockWhatsAppSubscription,
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue([]);
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_WHATSAPP",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("WELCOME_WHATSAPP");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByTestId("communication-template-mime"), {
      target: { value: "text/plain" },
    });
    fireEvent.change(screen.getByLabelText("Vendor Template ID"), {
      target: { value: "VENDOR_XYZ" },
    });

    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_WHATSAPP",
        expect.objectContaining({
          templateMimeType: "text/plain",
          vendorTemplateId: "VENDOR_XYZ",
        }),
      );
    });
  });

  it("hides vendorTemplateId for EMAIL templates and omits it from the create payload", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 53,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Email Template",
      subject: "",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    });
    (saveNotificationTemplateData as jest.Mock).mockResolvedValue("");
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("Welcome Email");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    expect(
      screen.queryByLabelText("Vendor Template ID"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "Email Template" },
    });

    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalled();
    });

    const payload = (createNotificationTemplate as jest.Mock).mock.calls[0][2];
    expect(payload).not.toHaveProperty("vendorTemplateId");
  });

  it("hides vendorTemplateId for SMS templates and omits it from the edit payload", async () => {
    (getNotificationSubscriptions as jest.Mock).mockResolvedValue([
      mockSmsSubscription,
    ]);
    (getNotificationTemplates as jest.Mock).mockResolvedValue([
      {
        id: 54,
        subscriptionKey: "WELCOME_SMS",
        templateName: "SMS Template",
        subject: "Hello",
        templateMimeType: "text/plain",
        language: "en",
        primary: false,
        vendorTemplateId: "LEGACY_VENDOR",
      },
    ]);
    (updateNotificationTemplate as jest.Mock).mockImplementation(
      async (_t, _k, id, payload) => ({
        ...payload,
        id,
        subscriptionKey: "WELCOME_SMS",
      }),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_SMS",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for SMS Template"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit metadata" }));

    expect(
      screen.queryByLabelText("Vendor Template ID"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "SMS Template Edited" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(updateNotificationTemplate).toHaveBeenCalled();
    });

    const payload = (updateNotificationTemplate as jest.Mock).mock.calls[0][3];
    expect(payload).not.toHaveProperty("vendorTemplateId");
  });

  it("creates a template with the selected language and language-aware starter HTML", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 52,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "Hindi Template",
      subject: "Namaste",
      templateMimeType: "text/html",
      language: "hi",
      primary: false,
    });
    (saveNotificationTemplateData as jest.Mock).mockResolvedValue("");
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("Welcome Email");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "Hindi Template" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Namaste" },
    });
    fireEvent.change(screen.getByTestId("communication-template-language"), {
      target: { value: "hi" },
    });

    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalledWith(
        "WELCOME",
        "WELCOME_EMAIL",
        expect.objectContaining({
          language: "hi",
        }),
      );
    });

    expect(saveNotificationTemplateData).toHaveBeenCalledWith(
      "WELCOME",
      "WELCOME_EMAIL",
      52,
      expect.stringContaining('<html lang="hi">'),
    );
  });

  it("submits template form via native form submit", async () => {
    (createNotificationTemplate as jest.Mock).mockResolvedValue({
      id: 51,
      subscriptionKey: "WELCOME_EMAIL",
      templateName: "NativeSubmit",
      subject: "",
      templateMimeType: "text/html",
      language: "en",
      primary: false,
    });
    (saveNotificationTemplateData as jest.Mock).mockResolvedValue("");
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("Welcome Email");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "NativeSubmit" },
    });

    const form = screen
      .getByLabelText("Template Name*")
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createNotificationTemplate).toHaveBeenCalled();
    });
  });

  it("shows error in template pane when template create fails", async () => {
    (createNotificationTemplate as jest.Mock).mockRejectedValue(
      new Error("template pane error"),
    );
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    await screen.findAllByText("Welcome Email");
    fireEvent.click(screen.getByRole("button", { name: "Create template" }));

    fireEvent.change(screen.getByLabelText("Template Name*"), {
      target: { value: "Will Fail" },
    });

    const tplPane = screen
      .getByText("Create Template")
      .closest('[data-testid="pane"]') as HTMLElement;
    fireEvent.click(within(tplPane).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("template pane error")).toBeInTheDocument();
  });

  it("keeps action menu open when mousedown is on the card action menu area", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(await screen.findByLabelText("Actions for WELCOME_EMAIL"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText("Actions for WELCOME_EMAIL"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  });

  it("does not call updateNotificationTemplate when template is already primary", async () => {
    mockSearchParams = new URLSearchParams(
      "type=WELCOME&subscriptionKey=WELCOME_EMAIL",
    );
    render(<CommunicationTemplateManager />);

    fireEvent.click(
      await screen.findByLabelText("Actions for Primary Welcome"),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Primary template" }));

    expect(updateNotificationTemplate).not.toHaveBeenCalled();
  });
});
