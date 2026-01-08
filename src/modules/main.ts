import { config } from "../../package.json";
import MarkdownIt = require("markdown-it");
const markdownItTaskLists = require("markdown-it-task-lists");
const markdownItSup = require("markdown-it-sup");
import { getLocaleID, getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import { getAvailableModels } from "../utils/models";

// Chat session types
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

export interface ChatSession {
  messages: ChatMessage[];
  pdfAttached: boolean;
  pdfContent?: string;
  uploadedPdf?: {
    attachmentID: number;
    fileName: string;
    fileUri: string;
    sizeBytes: number;
    displayName: string;
  } | null;
}

// Global chat sessions manager using WeakMap
const chatSessions = new WeakMap<Zotero.Item, ChatSession>();

// Helper function to get or create chat session
export function getChatSession(item: Zotero.Item): ChatSession {
  if (!chatSessions.has(item)) {
    chatSessions.set(item, {
      messages: [],
      pdfAttached: false,
      pdfContent: undefined,
    });
  }
  return chatSessions.get(item)!;
}

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id: pluginID }) => {
        this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/gemini.svg`,
    });
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      if (ev.shiftKey && ev.key === "S") {
        addon.hooks.onShortcuts("smaller");
      }
    });

    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet(win: Window) {
    const doc = win.document;
    const styles = ztoolkit.UI.createElement(doc, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/zoteroPane.css`,
      },
    });
    doc.documentElement.appendChild(styles);
    // doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  }

  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem-filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = Zotero.getMainWindow().document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "span",
        );
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: `chrome://${config.addonRef}/content/icons/gemini.svg`,
      },
      bodyXHTML:
        '<html:div style="display: flex;flex-direction: column;"><html:div style="display: flex;flex-direction: row;"><html:button id="clear_btn" style="font-size:18px;width:80px;height:40px;" >Clear</html:button><html:button id="add_title_btn" style="font-size:18px;width:80px;height:40px;" >+Title</html:button><html:button id="add_abs_btn" style="font-size:18px;width:80px;height:40px;" >+Abs</html:button><html:button id="getBib" style="font-size:18px;width:80px;height:40px;" >getBib</html:button></html:div><html:textarea id="uquery" cols="24" rows="10" style="font-size:18px;with:85%;" placeholder="user query"> </html:textarea><html:button id="uquery_btn" style="font-size:16px;width:80px;height:40px;" >Ask</html:button><html:button id="translate_btn" style="font-size:16px;width:80px;height:40px;" >translate</html:button><html:textarea id="result" cols="24" rows="24" style="font-size:18px;with:85%;" placeholder="result"> </html:textarea></html:div>',
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/gemini.svg`,
      },
      onRender: ({ body, item, editable, tabType }) => {},
    });
  }

  @example
  static async registerReaderItemPaneSection(win: Window) {
    const doc = win.document;

    // Inject a custom tab into the reader view
    // This creates a dedicated Gemini sidebar separate from item details
    Zotero.ItemPaneManager.registerSection({
      paneID: "gemini-chat-sidebar",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        icon: `chrome://${config.addonRef}/content/icons/gemini.svg`,
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/gemini.svg`,
      },
      bodyXHTML: `
        <html:div class="gemini-chat-root" style="display:flex;flex-direction:column;width:100%;height:100%;background:var(--zotero-pane-bg, #ffffff);font-family:inherit;color:var(--zotero-text-color, #1f1f1f);box-sizing:border-box;">
          <html:div id="chat-history-container" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
            <html:div id="chat-history" style="flex:1;overflow-y:auto;overflow-x:hidden;padding:16px;background:var(--zotero-pane-bg, #ffffff);scroll-behavior:smooth;box-sizing:border-box;">
              <html:div id="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px 24px;">
                <html:div style="width:80px;height:80px;background:linear-gradient(135deg,#4285f4 0%,#9b72cb 50%,#d96570 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 2px 12px rgba(66,133,244,0.2);position:relative;">
                  <html:img src="chrome://${config.addonRef}/content/icons/gemini.svg" style="width:48px;height:48px;filter:brightness(0) invert(1);" />
                </html:div>
                <html:div style="font-size:24px;font-weight:400;color:#1f1f1f;margin-bottom:12px;letter-spacing:-0.5px;">Gemini Assistant</html:div>
                <html:div data-l10n-id="${getLocaleID("chat-empty-state")}" style="color:#5f6368;font-size:14px;line-height:1.6;max-width:400px;">Start a conversation with Gemini</html:div>
              </html:div>
            </html:div>
          </html:div>
          <html:div id="controls-area" style="flex-shrink:0;padding:12px 14px 14px;background:var(--zotero-pane-bg, #ffffff);border-top:1px solid var(--zotero-border-color, #e1e1e1);box-sizing:border-box;">
            <html:div id="composer" style="display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--zotero-border-color, #d1d1d1);border-radius:12px;background:var(--zotero-textbox-bg, #ffffff);box-shadow:0 1px 0 rgba(0,0,0,0.04);">
              <html:div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                <html:select
                  id="model-selector"
                  style="flex:1;border:none;background:transparent;cursor:pointer;font-size:12px;color:inherit;appearance:none;outline:none;min-width:120px;"
                ></html:select>
                <html:button
                  id="new-session"
                  title="New session"
                  aria-label="New session"
                  style="flex-shrink:0;width:28px;height:28px;border:none;background:var(--zotero-toolbar-bg, #f5f5f5);border-radius:999px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;border:1px solid var(--zotero-border-color, #d1d1d1);"
                >
                  <html:img
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDV2MTQiLz48cGF0aCBkPSJNNiAxMWgxMiIvPjwvc3ZnPg=="
                    style="width:14px;height:14px;"
                  />
                </html:button>
                <html:button
                  id="pdf-toggle"
                  title="Attach PDF"
                  style="flex-shrink:0;width:28px;height:28px;border:none;background:var(--zotero-toolbar-bg, #f5f5f5);border-radius:999px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;padding:0;border:1px solid var(--zotero-border-color, #d1d1d1);position:relative;"
                >
                  <html:img
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxLjQ0IDExLjA1bC05LjE5IDkuMTlhNiA2IDAgMCAxLTguNDktOC40OWw5LjE5LTkuMTlhNCA0IDAgMCAxIDUuNjYgNS42NmwtOS4yIDkuMTlhMiAyIDAgMCAxLTIuODMtMi44M2w4LjQ5LTguNDgiLz48L3N2Zz4="
                    style="width:16px;height:16px;"
                  />
                </html:button>
              </html:div>
              <html:div style="display:flex;align-items:flex-end;gap:8px;">
                <html:textarea
                  id="message-input"
                  rows="1"
                  placeholder="Message Gemini..."
                  style="flex:1;border:none;outline:none;font-size:14px;font-family:inherit;resize:none;box-sizing:border-box;line-height:1.5;max-height:120px;background:transparent;"
                ></html:textarea>
                <html:button
                  id="send-button"
                  title="Send"
                  style="flex-shrink:0;width:32px;height:32px;border:none;border-radius:10px;background:#1a73e8;color:#ffffff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;"
                >
                  <html:img
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiA1djE0Ii8+PHBhdGggZD0iTTcgMTBsNS01IDUgNSIvPjwvc3ZnPg=="
                    style="width:16px;height:16px;filter:brightness(0) invert(1);"
                  />
                </html:button>
              </html:div>
            </html:div>
          </html:div>
        </html:div>
      `,
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        // Only show this section in the sidenav (dedicated) view, not in the main item pane
        setEnabled(true);
        return true;
      },

      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        // Hide the section header by making the parent section collapse/hide itself
        // when not in sidenav mode
        const section = body.closest("item-pane-section");
        if (section && section instanceof HTMLElement) {
          // Get the parent container to check if we're in a dedicated view
          const container = section.closest("#item-pane-section-list");
          if (container) {
            // We're in the main pane list - hide this section
            section.style.display = "none";
          }
        }

        // Add custom CSS animations
        const style = body.ownerDocument.createElement("style");
        style.textContent = `
          .gemini-chat-root {
            --gemini-surface: var(--zotero-textbox-bg, #ffffff);
            --gemini-border: var(--zotero-border-color, #d1d1d1);
            --gemini-muted: #6b7280;
            --gemini-user-bg: #e8f0fe;
            --gemini-assistant-bg: #f5f6f8;
            --gemini-shadow: 0 1px 0 rgba(0,0,0,0.04);
          }
          .gemini-msg {
            display: flex;
            margin: 10px 0;
            animation: slideIn 0.2s ease;
          }
          .gemini-msg-user {
            justify-content: flex-end;
          }
          .gemini-msg-assistant {
            justify-content: flex-start;
          }
          .gemini-bubble {
            max-width: 78%;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 13.5px;
            line-height: 1.6;
            border: 1px solid var(--gemini-border);
            box-shadow: var(--gemini-shadow);
          }
          .gemini-bubble pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 10px 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 8px 0;
          }
          .gemini-codeblock {
            position: relative;
          }
          .gemini-codeblock::before {
            content: attr(data-lang);
            position: absolute;
            top: -6px;
            right: 10px;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 6px;
            background: #eef1f4;
            color: #4b5563;
            border: 1px solid #e1e4e8;
          }
          .gemini-bubble p {
            margin: 6px 0;
          }
          .gemini-bubble h1,
          .gemini-bubble h2,
          .gemini-bubble h3,
          .gemini-bubble h4,
          .gemini-bubble h5,
          .gemini-bubble h6 {
            margin: 10px 0 6px;
            font-weight: 600;
            line-height: 1.3;
          }
          .gemini-bubble h1 {
            font-size: 17px;
          }
          .gemini-bubble h2 {
            font-size: 15.5px;
          }
          .gemini-bubble h3 {
            font-size: 14.5px;
          }
          .gemini-bubble h4,
          .gemini-bubble h5,
          .gemini-bubble h6 {
            font-size: 13.5px;
          }
          .gemini-bubble code {
            background: #f0f0f0;
            padding: 1px 4px;
            border-radius: 3px;
            font-family: monospace;
            color: #c7254e;
          }
          .gemini-bubble pre code {
            background: transparent;
            padding: 0;
            color: inherit;
          }
          .gemini-bubble blockquote {
            border-left: 3px solid #d0d4da;
            margin: 8px 0;
            padding: 4px 10px;
            color: #4b5563;
            background: #f7f8fa;
          }
          .gemini-bubble ul,
          .gemini-bubble ol {
            margin: 6px 0 6px 18px;
          }
          .gemini-bubble li {
            margin: 2px 0;
          }
          .gemini-bubble table {
            border-collapse: collapse;
            margin: 8px 0;
            width: 100%;
          }
          .gemini-bubble th,
          .gemini-bubble td {
            border: 1px solid #e1e4e8;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          .gemini-bubble th {
            background: #f7f8fa;
            font-weight: 600;
          }
          .gemini-bubble input[type="checkbox"] {
            margin-right: 6px;
          }
          .gemini-bubble a {
            color: #1a73e8;
            text-decoration: underline;
          }
          .gemini-bubble-user {
            background: #e7f0ff;
            color: #1f1f1f;
            border-bottom-right-radius: 4px;
          }
          .gemini-bubble-assistant {
            background: var(--gemini-assistant-bg);
            color: #1f1f1f;
            border-bottom-left-radius: 4px;
            border-color: #eceff3;
          }
          .gemini-meta {
            font-size: 11px;
            color: var(--gemini-muted);
            margin-bottom: 6px;
            letter-spacing: 0.2px;
          }
          .gemini-typing {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 0;
          }
          .gemini-typing span {
            width: 6px;
            height: 6px;
            background: #9aa0a6;
            border-radius: 50%;
            display: inline-block;
            animation: geminiDotPulse 1.2s infinite ease-in-out;
          }
          .gemini-typing span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .gemini-typing span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes geminiDotPulse {
            0%, 80%, 100% {
              transform: scale(0.7);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          #pdf-toggle:hover {
            background: #eef0f2 !important;
            border-color: #c8c8c8 !important;
          }
          #new-session:hover {
            background: #eef0f2 !important;
            border-color: #c8c8c8 !important;
          }
          #pdf-toggle.active {
            background: #e8f0fe !important;
            border-color: #1967d2 !important;
          }
          #pdf-toggle.active img {
            filter: invert(27%) sepia(98%) saturate(2036%) hue-rotate(206deg) brightness(94%) contrast(90%);
          }
          #model-selector {
            font-family: inherit;
          }
          #composer:focus-within {
            border-color: #4285f4 !important;
            box-shadow: 0 1px 6px rgba(66,133,244,0.2) !important;
          }
          #model-selector:focus {
            outline: none;
          }
          #model-selector:disabled {
            background-color: #f1f3f4 !important;
            cursor: not-allowed;
            opacity: 0.6;
          }
          #pdf-toggle[data-state="attached"]::after {
            content: "";
            position: absolute;
            right: 2px;
            top: 2px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            border: 1px solid #ffffff;
          }
          #send-button:hover {
            background: #1558b0;
          }
        `;
        body.appendChild(style);
      },

      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        const INLINE_MAX_BYTES = 8 * 1024 * 1024; // 8MB threshold for inlineData
        // Get DOM elements
        const chatHistory = body.querySelector("#chat-history") as HTMLElement;
        const messageInput = body.querySelector(
          "#message-input",
        ) as HTMLTextAreaElement;
        const modelSelector = body.querySelector(
          "#model-selector",
        ) as HTMLSelectElement;
        const newSessionButton = body.querySelector(
          "#new-session",
        ) as HTMLButtonElement;
        const pdfToggle = body.querySelector(
          "#pdf-toggle",
        ) as HTMLButtonElement;
        const sendButton = body.querySelector(
          "#send-button",
        ) as HTMLButtonElement;

        // Get or create chat session for this item
        const session = getChatSession(item);

        // Populate model selector with available models
        if (modelSelector) {
          // Clear existing options
          modelSelector.innerHTML = "";

          // Get available models (cached or defaults)
          const models = getAvailableModels();
          models.forEach((model) => {
            const option = body.ownerDocument.createElement("option");
            const modelName = model.name.replace("models/", "");
            option.value = modelName;
            option.textContent = model.displayName || modelName;
            modelSelector.appendChild(option);
          });

          // Set current model from preferences
          const currentModel =
            (getPref("model") as string) || "gemini-1.5-flash";
          modelSelector.value = currentModel;

          // Listen for model changes
          modelSelector.addEventListener("change", () => {
            setPref("model", modelSelector.value);
          });
        }

        // Track PDF toggle state
        let pdfEnabled = false;
        // Cache for uploaded file metadata to reuse (per session)
        if (!session.uploadedPdf) {
          (session as any).uploadedPdf = null as null | {
            attachmentID: number;
            fileName: string; // e.g., files/abc123
            fileUri: string; // uri to use in fileData
            sizeBytes: number;
            displayName: string;
          };
        }

        // Check if PDF is available
        const hasPdf = await checkPdfAvailability(item);
        if (!hasPdf) {
          pdfToggle.disabled = true;
          pdfToggle.style.opacity = "0.4";
          pdfToggle.style.cursor = "not-allowed";
          pdfToggle.title = "No PDF available";
        } else {
          // Enable by default when a PDF is available
          pdfEnabled = true;
          pdfToggle.classList.add("active");
          pdfToggle.title = session.pdfAttached
            ? "PDF already attached to conversation"
            : "PDF will be attached with next message";
          pdfToggle.setAttribute(
            "data-state",
            session.pdfAttached ? "attached" : "pending",
          );

          // Handle PDF toggle click
          pdfToggle.addEventListener("click", () => {
            pdfEnabled = !pdfEnabled;
            if (pdfEnabled) {
              pdfToggle.classList.add("active");
              if (session.pdfAttached) {
                pdfToggle.title = "PDF already attached to conversation";
                pdfToggle.setAttribute("data-state", "attached");
              } else {
                pdfToggle.title = "PDF will be attached with next message";
                pdfToggle.setAttribute("data-state", "pending");
              }
            } else {
              pdfToggle.classList.remove("active");
              pdfToggle.removeAttribute("data-state");
              pdfToggle.title = "Attach PDF";
            }
          });

          // Show status if PDF was already attached
          if (session.pdfAttached) {
            pdfToggle.title = "PDF already attached to conversation";
            pdfToggle.setAttribute("data-state", "attached");
          }
        }

        // Helper: Check PDF availability
        async function checkPdfAvailability(
          item: Zotero.Item,
        ): Promise<boolean> {
          let aiMessageObj:
            | {
                content: HTMLElement;
                copyBtn: HTMLElement;
              }
            | undefined;
          try {
            const attachments = await item.getAttachments();
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === "application/pdf") {
                return true;
              }
            }
            return false;
          } catch (error) {
            return false;
          }
        }

        // Helper: Get PDF content
        async function getPdfContent(
          item: Zotero.Item,
        ): Promise<string | null> {
          try {
            const attachments = await item.getAttachments();
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === "application/pdf") {
                return await attachment.attachmentText;
              }
            }
            return null;
          } catch (error) {
            ztoolkit.log("Error getting PDF content:", error);
            return null;
          }
        }

        // Helper: Get first PDF attachment info
        async function getPdfAttachmentInfo(item: Zotero.Item): Promise<null | {
          attachmentID: number;
          path: string;
          displayName: string;
          sizeBytes: number;
        }> {
          try {
            const attachments = await item.getAttachments();
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === "application/pdf") {
                const path = (await attachment.getFilePathAsync()) as
                  | string
                  | false;
                if (!path || typeof path !== "string") continue;
                // Read size via IOUtils.stat
                // @ts-ignore IOUtils is available in Zotero environment
                const stat = await IOUtils.stat(path);
                const displayName =
                  (attachment.getField("title") as string) || "attachment.pdf";
                return {
                  attachmentID,
                  path,
                  displayName,
                  sizeBytes: Number((stat as any).size || 0),
                };
              }
            }
            return null;
          } catch (e) {
            ztoolkit.log("Error getting PDF attachment info:", e);
            return null;
          }
        }

        // Helper: Read PDF as base64 string
        async function readPdfAsBase64(path: string): Promise<string> {
          // @ts-ignore IOUtils is available in Zotero environment
          const u8: Uint8Array = await IOUtils.read(path);
          // Convert to base64
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < u8.length; i += chunk) {
            binary += String.fromCharCode.apply(
              null,
              Array.from(u8.subarray(i, i + chunk)) as number[],
            );
          }
          // @ts-ignore btoa exists in Zotero (Gecko) environment
          return btoa(binary);
        }

        // Helper: Upload large PDF via File API (raw protocol)
        async function uploadPdfRaw(
          path: string,
          displayName: string,
        ): Promise<{
          fileName: string;
          fileUri: string;
          sizeBytes: number;
        } | null> {
          try {
            const apiKey = getPref("input") as string;
            if (!apiKey) {
              throw new Error("API Key not configured");
            }
            // Read bytes
            // @ts-ignore IOUtils is available in Zotero environment
            const u8: Uint8Array = await IOUtils.read(path);
            const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
            const res = await Zotero.HTTP.request("POST", url, {
              headers: {
                "X-Goog-Upload-Protocol": "raw",
                "X-Goog-Upload-File-Name": displayName,
                "X-Goog-Upload-Content-Type": "application/pdf",
                "Content-Type": "application/pdf",
              },
              body: u8.buffer as any,
              responseType: "json",
            });
            if (res.status !== 200) {
              ztoolkit.log(
                "Upload failed:",
                res.status,
                res.responseText || res.response,
              );
              return null;
            }
            const file = res.response as any;
            const fileName = file?.name || file?.file?.name || "";
            const fileUri = file?.uri || file?.file?.uri || "";
            const sizeBytes = Number(file?.sizeBytes || u8.length);
            if (!fileName || !fileUri) {
              return null;
            }
            return { fileName, fileUri, sizeBytes };
          } catch (e) {
            ztoolkit.log("Error uploading PDF:", e);
            return null;
          }
        }

        // Helper: Render user message
        function renderUserMessage(content: string) {
          // Remove empty state if exists
          const emptyState = chatHistory.querySelector(
            "#empty-state",
          ) as HTMLElement;
          if (emptyState) {
            emptyState.style.opacity = "0";
            emptyState.style.transform = "scale(0.95)";
            emptyState.style.transition = "all 0.2s ease";
            setTimeout(() => emptyState.remove(), 200);
          }

          const wrapper = body.ownerDocument.createElement("div");
          wrapper.className = "gemini-msg gemini-msg-user";

          const bubble = body.ownerDocument.createElement("div");
          bubble.className = "gemini-bubble gemini-bubble-user";

          const meta = body.ownerDocument.createElement("div");
          meta.className = "gemini-meta";
          meta.textContent = "You";

          const text = body.ownerDocument.createElement("div");
          text.style.whiteSpace = "pre-wrap";
          text.textContent = content;

          bubble.appendChild(meta);
          bubble.appendChild(text);
          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
        }

        // Helper: Create AI message element
        function createAssistantMessageElement(): {
          content: HTMLElement;
          copyBtn: HTMLElement;
        } {
          const wrapper = body.ownerDocument.createElement("div");
          wrapper.className = "gemini-msg gemini-msg-assistant";

          const bubble = body.ownerDocument.createElement("div");
          bubble.className = "gemini-bubble gemini-bubble-assistant";
          bubble.style.position = "relative";

          const meta = body.ownerDocument.createElement("div");
          meta.className = "gemini-meta";
          meta.textContent = "Gemini";

          const content = body.ownerDocument.createElement("div");
          content.style.paddingRight = "40px";
          content.style.lineHeight = "1.7";
          content.className = "gemini-assistant-content";

          const typing = body.ownerDocument.createElement("div");
          typing.className = "gemini-typing";
          typing.innerHTML = "<span></span><span></span><span></span>";
          content.appendChild(typing);

          const copyBtn = body.ownerDocument.createElement("button");
          copyBtn.innerHTML = "Copy";
          copyBtn.setAttribute("title", "Copy to clipboard");
          copyBtn.setAttribute(
            "style",
            "display:none;position:absolute;right:10px;top:10px;background:#ffffff;border:1px solid #dadce0;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;line-height:1.2;transition:all 0.2s ease;box-shadow:0 1px 2px rgba(0,0,0,0.05);text-align:center;min-width:44px;",
          );

          copyBtn.addEventListener("mouseenter", () => {
            copyBtn.style.background = "#f1f3f4";
            copyBtn.style.transform = "scale(1.05)";
          });

          copyBtn.addEventListener("mouseleave", () => {
            copyBtn.style.background = "#ffffff";
            copyBtn.style.transform = "scale(1)";
          });

          copyBtn.addEventListener("click", () => {
            const textContent = content.textContent || "";
            try {
              // Use Zotero toolkit clipboard
              new ztoolkit.Clipboard()
                .addText(textContent, "text/unicode")
                .copy();
              copyBtn.textContent = "Copied";
              copyBtn.style.background = "#e8f5e9";
              copyBtn.style.borderColor = "#81c784";
              setTimeout(() => {
                copyBtn.textContent = "Copy";
                copyBtn.style.background = "#ffffff";
                copyBtn.style.borderColor = "#dadce0";
              }, 2000);
            } catch (error) {
              ztoolkit.log("Copy failed:", error);
              copyBtn.textContent = "Error";
              copyBtn.style.background = "#ffebee";
              copyBtn.style.borderColor = "#ef5350";
              setTimeout(() => {
                copyBtn.textContent = "Copy";
                copyBtn.style.background = "#ffffff";
                copyBtn.style.borderColor = "#dadce0";
              }, 2000);
            }
          });

          bubble.appendChild(meta);
          bubble.appendChild(content);
          bubble.appendChild(copyBtn);
          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
          return { content, copyBtn };
        }

        const md = new MarkdownIt({
          html: false,
          linkify: true,
          breaks: true,
        });
        md.enable("table");
        md.use(markdownItTaskLists, { label: true, labelAfter: true });
        md.use(markdownItSup);
        const defaultFence = md.renderer.rules.fence;
        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
          const token = tokens[idx];
          const info = (token.info || "").trim();
          const lang = info ? info.split(/\s+/g)[0] : "";
          const code = defaultFence
            ? defaultFence(tokens, idx, options, env, slf)
            : slf.renderToken(tokens, idx, options);
          if (!lang) return code;
          const safeLang = md.utils.escapeHtml(lang);
          return `<div class="gemini-codeblock" data-lang="${safeLang}">${code}</div>`;
        };

        // Helper: Markdown to HTML converter
        function markdownToHtml(markdown: string): string {
          return md.render(markdown);
        }

        // Helper: Update message content with markdown rendering
        function updateMessageContent(
          messageObj: { content: HTMLElement; copyBtn: HTMLElement },
          content: string,
        ) {
          const typing = messageObj.content.querySelector(".gemini-typing");
          if (typing) typing.remove();
          messageObj.content.innerHTML = markdownToHtml(content);
          scrollToBottom();
        }

        // Helper: Show copy button
        function showCopyButton(copyBtn: HTMLElement) {
          copyBtn.style.display = "block";
        }

        // Helper: Scroll to bottom
        function scrollToBottom() {
          chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        // Helper: Show error message
        function showError(message: string) {
          const wrapper = body.ownerDocument.createElement("div");
          wrapper.setAttribute(
            "style",
            "display:block;margin:8px 0;text-align:center;",
          );

          const bubble = body.ownerDocument.createElement("div");
          bubble.setAttribute(
            "style",
            "display:inline-block;background:#ff4444;color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;",
          );
          bubble.textContent = `⚠️ ${message}`;

          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
        }

        // Main: Send message function
        async function sendMessage() {
          const userMessage = messageInput.value.trim();
          if (!userMessage) return;
          let aiMessageObj:
            | {
                content: HTMLElement;
                copyBtn: HTMLElement;
              }
            | undefined;

          // Get API credentials (read fresh each time)
          const GEMINI_API_KEY = getPref("input") as string;
          const model =
            modelSelector.value ||
            (getPref("model") as string) ||
            "gemini-1.5-flash";

          // Validate API settings
          if (!GEMINI_API_KEY) {
            showError(getString("chat-error-no-api-key"));
            return;
          }

          // Disable inputs
          messageInput.disabled = true;
          modelSelector.disabled = true;
          pdfToggle.disabled = true;

          try {
            // Render user message
            renderUserMessage(userMessage);

            // Prepare message content
            let finalContent = userMessage;

            // Handle PDF attachment
            if (pdfEnabled && !session.pdfAttached) {
              if (!session.pdfContent) {
                const pdfContent = await getPdfContent(item);
                session.pdfContent = pdfContent || undefined;
              }
              if (session.pdfContent) {
                finalContent += "\n\nPDF Content:\n" + session.pdfContent;
                session.pdfAttached = true;
                pdfEnabled = false; // Reset after attaching
                pdfToggle.classList.remove("active");
                pdfToggle.title = "PDF already attached to conversation";
                pdfToggle.setAttribute("data-state", "attached");
                pdfToggle.disabled = true;
              } else {
                showError(getString("chat-error-no-pdf"));
              }
            }

            // Add user message to history
            session.messages.push({
              role: "user",
              content: finalContent,
              timestamp: Date.now(),
            });

            // Build API messages for Gemini
            const systemPrompt =
              (getPref("systemPrompt") as string) ||
              "You are a research assistant.";
            // Gemini doesn't have system role, prepend it to first user message
            const geminiContents = session.messages.map((msg, index) => {
              let text = msg.content;
              // Add system prompt to first user message
              if (index === 0 && msg.role === "user") {
                text = systemPrompt + "\n\n" + text;
              }
              return {
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text }],
              };
            });

            // If PDF toggle is enabled, attach real PDF as inlineData or fileData
            if (pdfEnabled && !session.pdfAttached) {
              const info = await getPdfAttachmentInfo(item);
              if (info) {
                let pdfPart: any = null;
                if (info.sizeBytes <= INLINE_MAX_BYTES) {
                  const base64 = await readPdfAsBase64(info.path);
                  pdfPart = {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: base64,
                    },
                  };
                } else {
                  // Large file: upload once and reuse
                  const cached = (session as any).uploadedPdf as null | {
                    attachmentID: number;
                    fileName: string;
                    fileUri: string;
                    sizeBytes: number;
                    displayName: string;
                  };
                  let use =
                    cached && cached.attachmentID === info.attachmentID
                      ? cached
                      : null;
                  if (!use) {
                    const uploaded = await uploadPdfRaw(
                      info.path,
                      info.displayName,
                    );
                    if (uploaded) {
                      use = {
                        attachmentID: info.attachmentID,
                        fileName: uploaded.fileName,
                        fileUri: uploaded.fileUri,
                        sizeBytes: uploaded.sizeBytes,
                        displayName: info.displayName,
                      };
                      (session as any).uploadedPdf = use;
                    }
                  }
                  if (use) {
                    pdfPart = {
                      fileData: {
                        fileUri: use.fileUri,
                      },
                    };
                  }
                }

                if (pdfPart) {
                  // Append to the latest user message parts
                  for (let i = geminiContents.length - 1; i >= 0; i--) {
                    if (geminiContents[i].role === "user") {
                      (geminiContents[i].parts as any[]).push(pdfPart);
                      break;
                    }
                  }
                  session.pdfAttached = true;
                  pdfToggle.title = "PDF attached";
                  pdfToggle.setAttribute("data-state", "attached");
                  pdfToggle.disabled = true;
                }
              }
            }

            // Create AI message element
            aiMessageObj = createAssistantMessageElement();
            let assistantContent = "";

            // Call API with streaming
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`;
            ztoolkit.log(
              "Calling Gemini API:",
              apiUrl.replace(GEMINI_API_KEY, "***"),
            );
            ztoolkit.log(
              "Request body:",
              JSON.stringify({ contents: geminiContents }, null, 2),
            );

            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: geminiContents,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              ztoolkit.log("API Error:", response.status, errorText);

              // Parse error for better user message
              let userMessage = `Error ${response.status}: ${response.statusText}`;
              try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.message) {
                  userMessage = errorData.error.message;

                  // Special handling for quota errors
                  if (response.status === 429) {
                    userMessage = `Rate limit exceeded. ${errorData.error.message.split("\\n")[0]}\n\nTry:\n• Using a different model (e.g., gemini-1.5-flash)\n• Waiting a few minutes\n• Checking your quota at https://ai.dev/usage`;
                  }
                }
              } catch (e) {
                // Use raw error text if parsing fails
                userMessage += `\n\n${errorText}`;
              }

              throw new Error(userMessage);
            }

            // Process streaming response
            // Gemini streams JSON objects separated by newlines or commas
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              // Try to extract complete JSON objects
              // Look for patterns like {...}\n or {...},
              let startIdx = 0;
              let braceCount = 0;
              let inString = false;
              let escapeNext = false;

              for (let i = 0; i < buffer.length; i++) {
                const char = buffer[i];

                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }

                if (char === "\\") {
                  escapeNext = true;
                  continue;
                }

                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }

                if (inString) continue;

                if (char === "{") {
                  if (braceCount === 0) startIdx = i;
                  braceCount++;
                } else if (char === "}") {
                  braceCount--;
                  if (braceCount === 0) {
                    // Found complete JSON object
                    const jsonStr = buffer.substring(startIdx, i + 1);
                    try {
                      const data = JSON.parse(jsonStr);
                      const content =
                        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

                      if (content) {
                        assistantContent += content;
                        updateMessageContent(aiMessageObj, assistantContent);
                      }
                    } catch (error) {
                      ztoolkit.log("Failed to parse JSON:", jsonStr, error);
                    }
                    // Remove processed part from buffer
                    buffer = buffer.substring(i + 1);
                    i = -1; // Reset index after buffer modification
                    startIdx = 0;
                  }
                }
              }
            }

            // Add assistant message to history
            if (assistantContent) {
              session.messages.push({
                role: "assistant",
                content: assistantContent,
                timestamp: Date.now(),
              });
              // Show copy button after completion
              showCopyButton(aiMessageObj.copyBtn);
            }

            // Clear input
            messageInput.value = "";
            messageInput.style.height = "auto";
          } catch (error) {
            ztoolkit.log("Error sending message:", error);
            if (aiMessageObj) {
              const message =
                getString("chat-error-api") + `: ${String(error)}`;
              updateMessageContent(aiMessageObj, message);
              showCopyButton(aiMessageObj.copyBtn);
            } else {
              showError(getString("chat-error-api") + `: ${error}`);
            }
          } finally {
            // Re-enable inputs
            messageInput.disabled = false;
            modelSelector.disabled = false;
            if (hasPdf && !session.pdfAttached) {
              pdfToggle.disabled = false;
            }
            messageInput.focus();
          }
        }

        // Auto-resize textarea
        messageInput.addEventListener("input", () => {
          messageInput.style.height = "auto";
          messageInput.style.height =
            Math.min(messageInput.scrollHeight, 120) + "px";
        });

        function renderEmptyState() {
          const existing = chatHistory.querySelector("#empty-state");
          if (existing) return;
          const empty = body.ownerDocument.createElement("div");
          empty.id = "empty-state";
          empty.setAttribute(
            "style",
            "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px 24px;",
          );
          empty.innerHTML = `
            <div style="width:80px;height:80px;background:linear-gradient(135deg,#4285f4 0%,#9b72cb 50%,#d96570 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 2px 12px rgba(66,133,244,0.2);position:relative;">
              <img src="chrome://${config.addonRef}/content/icons/gemini.svg" style="width:48px;height:48px;filter:brightness(0) invert(1);" />
            </div>
            <div style="font-size:24px;font-weight:400;color:#1f1f1f;margin-bottom:12px;letter-spacing:-0.5px;">Gemini Assistant</div>
            <div data-l10n-id="${getLocaleID("chat-empty-state")}" style="color:#5f6368;font-size:14px;line-height:1.6;max-width:400px;">Start a conversation with Gemini</div>
          `;
          chatHistory.appendChild(empty);
        }

        newSessionButton.addEventListener("click", () => {
          const win = body.ownerDocument.defaultView as any;
          const services = ztoolkit.getGlobal("Services") as any;
          const confirmed = services?.prompt?.confirm
            ? services.prompt.confirm(
                win,
                "Zotero Gemini",
                "Start a new session? This will clear the current chat history.",
              )
            : win?.confirm(
                "Start a new session? This will clear the current chat history.",
              );
          if (!confirmed) return;
          session.messages = [];
          session.pdfAttached = false;
          session.pdfContent = undefined;
          (session as any).uploadedPdf = null;
          pdfEnabled = hasPdf;
          if (hasPdf) {
            pdfToggle.classList.add("active");
            pdfToggle.setAttribute("data-state", "pending");
            pdfToggle.title = "PDF will be attached with next message";
            pdfToggle.disabled = false;
          } else {
            pdfToggle.classList.remove("active");
            pdfToggle.removeAttribute("data-state");
            pdfToggle.title = "No PDF available";
            pdfToggle.disabled = true;
          }
          chatHistory.innerHTML = "";
          renderEmptyState();
        });

        // Send on Enter, new line on Shift+Enter
        messageInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
        sendButton.addEventListener("click", () => {
          sendMessage();
        });

        // Restore chat history if exists
        if (session.messages.length > 0) {
          // Remove empty state
          const emptyState = chatHistory.querySelector("#empty-state");
          if (emptyState) {
            emptyState.remove();
          }

          // Render existing messages (without PDF content in display)
          for (const msg of session.messages) {
            if (msg.role === "user") {
              // Display user message without PDF content
              const displayContent = msg.content.split("\n\nPDF Content:\n")[0];
              renderUserMessage(displayContent);
            } else if (msg.role === "assistant") {
              const aiMessageObj = createAssistantMessageElement();
              updateMessageContent(aiMessageObj, msg.content);
              showCopyButton(aiMessageObj.copyBtn);
            }
          }
        }
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },
    });
  }
}

export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
    var pTitle = "";
    var pTitleH = "";
    var Review_text = "";
    var topic = "";

    for (var i in items) {
      if ((items[i].getField("abstractNote") as string) == "Topic") {
        topic = items[i].getField("title") as string;
        continue;
      }

      var title = ("title: " + items[i].getField("title")) as string;
      var abstract = ("abstract: " +
        items[i].getField("abstractNote")) as string;
      var authors = items[i].getCreators();
      var authorss = [];
      for (var j in authors) {
        authorss.push(authors[j].firstName + " " + authors[j].lastName);
      }

      pTitleH += (items[i].getField("title") as string) + "\n";
      pTitle +=
        (("Paper" +
          i +
          ":\n" +
          title +
          "\n" +
          "authors:" +
          authorss.join() +
          "\n" +
          "year:" +
          items[i].getField("date")) as string) +
        "\n" +
        abstract +
        "\n\n";

      // var url = 'https://dblp.uni-trier.de/search/publ/api?q=' + items[i].getField("title") + '&format=bib'
      // const response = await fetch(url);
      // if (!response.ok) {
      //   throw new Error('Network response was not ok');
      // } else {

      //   var data = await response.text();
      //   // pTitle += '' + items[i].getField("title") + '\n\n';
      //   pTitleH += '' + items[i].getField("title") + '<br>';
      //   pTitle+='' + data + '\n'+'\n'+abstract+'\n';

      // }

      // const attachments = await items[i].getAttachments();

      // let pdfAttachment = null;
      // let pdfPath_content = null;

      // for (const attachmentID of attachments) {
      //   const attachment = await Zotero.Items.getAsync(attachmentID);
      //   if (attachment.attachmentContentType === 'application/pdf') {
      //     pdfAttachment = attachment;
      //     pdfPath_content = await attachment.attachmentText;
      //     pTitleH=pdfPath_content.substring(0,100);
      //     break;
      //   }
      // }
    }

    const GEMINI_API_KEY = getPref("input") as string;
    const model = (getPref("model") as string) || "gemini-1.5-flash";

    if (!GEMINI_API_KEY || !topic) {
      Review_text =
        "API key is null or topic is empty, please set them in settings.";
    }

    // var user_qtxt = uquery.value;

    // if (ask_pdf.checked == true) {
    //   const attachments = await item.getAttachments();

    //   let pdfAttachment = null;
    //   let pdfPath_content = null;

    //   for (const attachmentID of attachments) {
    //     const attachment = await Zotero.Items.getAsync(attachmentID);
    //     if (attachment.attachmentContentType === 'application/pdf') {
    //       pdfAttachment = attachment;
    //       pdfPath_content = await attachment.attachmentText;
    //       break;
    //     }
    //   }

    //   if (!pdfPath_content) {
    //     result_p.textContent = 'No PDF attachment found for this item.';
    //     return;
    //   }
    //   user_qtxt += "\n\n paper pdf text:\n\n" + `${pdfPath_content}`;
    // }
    var system_prompt = `You are a computer science researcher. Based on the provided literature, write a comprehensive related work section about ${topic}. Instead of simply listing papers, identify and discuss the common ground and key differences between studies.

Writing Requirements:

1.Maintain a balanced style: 60% formal academic tone, 40% conversational clarity.
2.Use clear subjects in each sentence and prefer short, crisp sentence structures over long, complex ones.
3.Synthesize the literature into a natural, compact paragraph format.
4.Include proper LaTeX citations (e.g., \cite{author2023}) at appropriate locations within the text.

Focus on creating a cohesive narrative that demonstrates how the field has evolved and where current gaps or disagreements exist.`;

    // Convert to Gemini format: prepend system prompt to user content
    var requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${system_prompt}\n\nliteratures:\n${pTitle}`,
            },
          ],
        },
      ],
    };

    try {
      var response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      } else {
        const reader = response.body?.getReader();

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader!.read();
          done = streamDone;
          if (value) {
            // 解析数据块

            const chunk = decoder.decode(value, { stream: true });
            // 处理每个数据块

            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");
            for (var line of lines) {
              try {
                line = line.replace("data:", "");
                // result_p.textContent+=line;
                const data = JSON.parse(line);
                if (data.candidates && data.candidates[0]) {
                  const text =
                    data.candidates[0].content?.parts?.[0]?.text || "";
                  // process.stdout.write(text); // 直接输出文本到控制台
                  Review_text += text;
                }
              } catch (error) {
                ztoolkit.log("Could not parse JSON:", line);
                // result_p.textContent+=error as string;
              }
            }
          }
        }
      }
    } catch (error) {
      ztoolkit.log("Error", error);
      throw error;
    }

    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };
    const dialogHelper = new ztoolkit.Dialog(2, 2)
      .addCell(0, 0, {
        tag: "p",
        properties: {
          innerHTML: `${pTitleH}`,
        },
        styles: {
          width: "440px",
          fontSize: "12",
        },
      })
      .addCell(
        1,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                new ztoolkit.Clipboard()
                  .addText(`${pTitle}`, "text/unicode")
                  .copy();
                ztoolkit.getGlobal("alert")("Copied!");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "Copy",
              },
            },
          ],
        },
        false,
      )
      .addCell(
        1,
        1,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                new ztoolkit.Clipboard()
                  .addText(`${Review_text}`, "text/unicode")
                  .copy();
                ztoolkit.getGlobal("alert")("Copied!");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "Copy Review",
              },
            },
          ],
        },
        false,
      )
      .addButton("Cancel", "cancel")
      .setDialogData(dialogData)
      .open("Papers");

    addon.data.dialog = dialogHelper;
    await dialogData.unloadLock.promise;
    addon.data.dialog = undefined;

    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode",
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html",
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png",
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
