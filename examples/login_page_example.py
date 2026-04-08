from pageobjects.base_page import BasePage


class Login(BasePage):

    button_confirm_cookies = "//*[@id='popin_tc_privacy_button']"
    input_user = "//*[@data-test-id='input-username']"
    input_password = "//*[@data-test-id='input-password']"
    button_login = "//*[@data-test-id='submit']"
    link_reset_password = "//*[@data-test-id='link-forgot-password']"
    link_request_username = "//*[@data-test-id='link-forgot-username']"
    input_email = "//*[@data-test-id='input-email']"
    input_confirmed_email = "//*[@data-test-id='input-confirmed-email']"
    text_initial_password = "//*[@data-test-id='initial-password-hint']"
    text_password_length = "//*[@data-test-id='input-password']/following-sibling::div"
    input_mobile_number = "//*[@data-test-id='input-mobile-number']"
    button_unlock_account = "//*[@data-test-id='unlock-account']"
