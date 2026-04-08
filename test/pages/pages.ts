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
}
