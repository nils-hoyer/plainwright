import { BasePage } from '../../src/pages/BasePage';

export class LoginPage extends BasePage {
  // Cookie banner
  btnAcceptCookies = '[data-testid="btn-accept-cookies"]';

  // Form fields
  inputUsername = '[data-testid="input-username"]';
  inputPassword = '[data-testid="input-password"]';

  // Validation hints
  hintUsername = '[data-testid="hint-username"]';
  errorMessage = '[data-testid="error-message"]';

  // Buttons & links
  btnSubmit = '[data-testid="btn-submit"]';
  linkForgotPassword = '[data-testid="link-forgot-password"]';

  // Modal
  btnCloseModal = '[data-testid="btn-close-modal"]';
}

export class DashboardPage extends BasePage {
  headingWelcome = '[data-testid="heading-welcome"]';
  sectionOverview = '[data-testid="section-overview"]';
  itemSavings = '[data-testid="item-savings"]';
  btnTransfer = '[data-testid="btn-transfer"]';
  btnDisabled = '[data-testid="btn-disabled"]';
  linkForms = '[data-testid="link-forms"]';
  linkInteractions = '[data-testid="link-interactions"]';
}

export class FormsPage extends BasePage {
  inputFullName = '[data-testid="input-full-name"]';
  inputEmail = '[data-testid="input-email"]';
  inputReadonly = '[data-testid="input-readonly"]';
  inputDisabled = '[data-testid="input-disabled"]';
  selectCountry = '[data-testid="select-country"]';
  checkboxTerms = '[data-testid="checkbox-terms"]';
  checkboxNewsletter = '[data-testid="checkbox-newsletter"]';
  inputFile = '[data-testid="input-file"]';
  btnSubmitForm = '[data-testid="btn-submit-form"]';
  formResult = '[data-testid="form-result"]';
  btnSetStorage = '[data-testid="btn-set-storage"]';
  btnClearStorage = '[data-testid="btn-clear-storage"]';
  storageDisplay = '[data-testid="storage-display"]';
  btnSetCookie = '[data-testid="btn-set-cookie"]';
  btnDeleteCookie = '[data-testid="btn-delete-cookie"]';
}

export class InteractionsPage extends BasePage {
  hoverTarget = '[data-testid="hover-target"]';
  hoverTooltip = '[data-testid="hover-tooltip"]';
  scrollTarget = '[data-testid="scroll-target"]';
  btnDoubleClick = '[data-testid="btn-double-click"]';
  doubleClickResult = '[data-testid="double-click-result"]';
  rightClickTarget = '[data-testid="right-click-target"]';
  rightClickResult = '[data-testid="right-click-result"]';
  btnAlert = '[data-testid="btn-alert"]';
  btnConfirm = '[data-testid="btn-confirm"]';
  btnPrompt = '[data-testid="btn-prompt"]';
  dialogResult = '[data-testid="dialog-result"]';
  inputKeyboard = '[data-testid="input-keyboard"]';
  linkNewTab = '[data-testid="link-new-tab"]';
  iframeDemo = '[data-testid="iframe-demo"]';
}

export class DownloadPage extends BasePage {
  btnDownload = '[data-testid="btn-download"]';
}

export class DragPage extends BasePage {
  dragSource = '[data-testid="drag-source"]';
  dropTarget = '[data-testid="drop-target"]';
  dragResult  = '[data-testid="drag-result"]';
}

export class FileChooserPage extends BasePage {
  btnUpload       = '[data-testid="btn-upload"]';
  fileInput       = '[data-testid="file-input"]';
  fileResult      = '[data-testid="file-result"]';
  btnUploadMulti  = '[data-testid="btn-upload-multi"]';
  fileResultMulti = '[data-testid="file-result-multi"]';
}

export class MousePage extends BasePage {
  mouseTarget   = '[data-testid="mouse-target"]';
  lastEvent     = '[data-testid="last-event"]';
  lastMousedown = '[data-testid="last-mousedown"]';
  lastMouseup   = '[data-testid="last-mouseup"]';
}

export class TouchPage extends BasePage {
  tapTarget      = '[data-testid="tap-target"]';
  tapResult      = '[data-testid="tap-result"]';
  anywhereResult = '[data-testid="anywhere-result"]';
}

export class AssertionsPage extends BasePage {
  textExact = '[data-testid="text-exact"]';
  textPartial = '[data-testid="text-partial"]';
  divEmpty = '[data-testid="div-empty"]';
  hiddenAttached = '[data-testid="hidden-attached"]';
  classedElement = '[data-testid="classed-element"]';
  inputWithId = '[data-testid="input-with-id"]';
  btnRole = '[data-testid="btn-role"]';
  btnAriaLabel = '[data-testid="btn-aria-label"]';
  inputAriaDescribed = '[data-testid="input-aria-described"]';
  inputAriaError = '[data-testid="input-aria-error"]';
  divVisibleJs = '[data-testid="div-visible-js"]';
  selectMulti = '[data-testid="select-multi"]';
  inViewport = '[data-testid="in-viewport"]';
  belowViewport = '[data-testid="below-viewport"]';
}
