import os
import time
from datetime import datetime

from assertpy import assert_that
from getgauge.python import data_store, step
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait

from framework.test_session import TestSession
from framework.utils import Utils


@step("When I click the <element>")
def when_i_click_the_element(element):
    if '_docker' in TestSession.config['browser'] and element == 'button confirm cookies':
        return
    TestSession.driver_helper.get_element(element).click()


@ step("When I click the text <text>")
def when_i_click_the_text(text):
    TestSession.driver_helper.get_element_by_text(text).click()


@ step("When I type <text> in the <element>")
def when_i_type_text_in_element(text, element):
    element = TestSession.driver_helper.get_element(element)
    element.clear()
    element.send_keys(text)


@ step("When I visit the url <url>")
def when_i_visit_the_url(url):
    url = url if "http" in url else TestSession.config["base_url"] + url
    TestSession.driver.get(url)


@ step("When I switch to browser tab <number>")
def when_i_switch_to_browser_tab(number):
    # tab index start from 0
    new_tab = TestSession.driver.window_handles[int(number) - 1]
    TestSession.driver.switch_to.window(new_tab)


@ step("When I open a browser tab")
def when_i_open_a_browser_tab():
    TestSession.driver.execute_script(
        "window.open('about:blank','_blank', 'noopener=true');")
    when_i_switch_to_browser_tab(2)


@ step("When I scroll to bottom of the page")
def when_i_scroll_to_the_bottom_of_the_page():
    TestSession.driver.execute_script(
        "window.scrollTo(0,document.body.scrollHeight)")


@ step("When I scroll to <element>")
def when_i_scroll_to_the_element(element):
    def try_get_element(element):
        try:
            TestSession.driver_helper.get_element(element)
            return True
        except TimeoutException:
            return False
    while try_get_element(element):
        test_id = TestSession.driver_helper.get_element(
            element).get_attribute("data-test-id")
        js_code = f'const domElement = document.querySelector("[data-test-id=\'{test_id}\']");window.scrollTo(0,domElement.offsetTop)'
        TestSession.driver.execute_script(
            js_code)
        break


@ step("When I load all transactions")
def when_i_load_all_transactions():
    def try_get_element(element):
        try:
            TestSession.driver_helper.get_element(element)
            return True
        except TimeoutException:
            return False
    while try_get_element("image_loading"):
        TestSession.driver.execute_script(
            "window.scrollTo(0,document.body.scrollHeight-3000)")
        when_i_scroll_to_the_bottom_of_the_page()
    when_i_scroll_to_the_bottom_of_the_page()


@ step("When I wait for <seconds> seconds")
def when_i_idle_for_seconds(seconds):
    time.sleep(int(seconds))


@ step("Then I see the text <text>")
def then_i_see_the_text(text):
    TestSession.driver_helper.get_element_by_text(text)


@ step("Then I see the text <text> in element <element>")
def then_i_see_the_text_in_element(text, element):
    _element = TestSession.driver_helper.get_element(element)

    element_or_input = 'value' if "input" in element else 'textContent'
    element_text = _element.get_attribute(element_or_input)
    normalized_text = Utils.normalize_string(element_text)

    assert_that(normalized_text).contains(text)


@ step("Then I not see the text <text> in element <element>")
def then_i_not_see_the_text_in_element(text, element):
    _element = TestSession.driver_helper.get_element(element)

    element_or_input = 'value' if "input" in element else 'textContent'
    element_text = _element.get_attribute(element_or_input)
    normalized_text = Utils.normalize_string(element_text)

    assert_that(normalized_text).does_not_contain(text)


@ step("Then I see the attribute <attribute> in element <element>")
def then_i_see_the_attribute_in_element(attribute, element):
    element = TestSession.driver_helper.get_element(element)

    assert_that(element.get_attribute(attribute)).is_equal_to("true")


@ step("Then I not see the attribute <attribute> in element <element>")
def then_i_not_see_the_attribute_in_element(attribute, element):
    element = TestSession.driver_helper.get_element(element)

    assert_that(element.get_attribute(attribute)).is_none()


@ step("Then I see the text by regexp <regexp> in element <element>")
def then_i_see_the_text_by_regexp_in_element(regexp, element):
    _element = TestSession.driver_helper.get_element(element)

    element_or_input = 'value' if "input" in element else 'textContent'
    text = _element.get_attribute(element_or_input)
    normalized_text = Utils.normalize_string(text)

    assert_that(normalized_text).matches(regexp)


@ step("Then I not see the text by regexp <regexp> in element <element>")
def then_i_not_see_the_text_by_regexp_in_element(regexp, element):
    _element = TestSession.driver_helper.get_element(element)

    element_or_input = 'value' if "input" in element else 'textContent'
    text = _element.get_attribute(element_or_input)
    normalized_text = Utils.normalize_string(text)

    assert_that(normalized_text).does_not_match(regexp)


@ step("Then I see the text in <element> is <operator> then <expected_text>")
def then_i_see_the_text_in_element_is_then(
        element, operator, expected_text):
    text = TestSession.driver_helper.get_element(element).text
    given_text = Utils.string_to_money(text)
    expected_text = Utils.string_to_money(expected_text)

    assert_that(Utils.compare(given_text, operator, expected_text)).is_true()


@ step("Then I see the <element>")
def then_i_see_the_element(element):
    TestSession.driver_helper.get_element(element)


@ step("Then I not see the <element>")
def then_i_not_see_the_element(element):
    selector = Utils.get_class_property(
        TestSession.get_current_page_object(),
        element)

    # set to zero to allow retry for invisibility_of_element(). otherwise internal find_element() in
    # invisibility_of_element() will wait for element with default wait time.
    # This leads to invisibility_of_element() will only called once and always
    # wait the maxium config wait time.
    TestSession.driver.implicitly_wait(0)

    WebDriverWait(TestSession.driver, TestSession.config["timeout"]).until(
        expected_conditions.invisibility_of_element((By.XPATH, selector)),
        f"element is not invisible from selector '{selector}'")

    TestSession.driver.implicitly_wait(TestSession.config["timeout"])


@ step("Then I see the url <url>")
def then_i_see_the_url(url):
    # ignore base_url if url provide full url
    url = url if "http" in url else TestSession.config["base_url"] + url
    WebDriverWait(
        TestSession.driver,
        TestSession.config["timeout"]).until(
            expected_conditions.url_to_be(url),
            f"url '{TestSession.driver.current_url}' is not equals '{url}'")


@ step("Then I see the url containing <url_part>")
def then_i_see_url_containing(url_part):
    WebDriverWait(TestSession.driver, TestSession.config["timeout"]).until(
        expected_conditions.url_contains(url_part),
        f"url '{TestSession.driver.current_url}' does not contain '{url_part}'")


@ step("Then I see the file <file>")
def then_i_see_the_file(file):
    path = TestSession.config["download_path"] + file
    WebDriverWait(
        TestSession.driver,
        TestSession.config["timeout"]).until(
            lambda x: os.path.isfile(path),
            f"file {file} does not exist in folder downloads")


@ step("Then I see the download <file>")
def then_i_see_the_download(file):
    if (TestSession.config['headless'] == 'true'):
        then_i_see_the_file(file)
    else:
        when_i_switch_to_browser_tab(2)
        then_i_see_url_containing(file)
        when_i_switch_to_browser_tab(1)


@ step(["Then I see the page <page>", "Given I see the page <page>"])
def then_i_see_the_page(page):
    TestSession.set_current_page_object(page)


@ step(["When I start the clockwatch"])
def when_i_start_the_clockwatch():
    time_start = datetime.now()
    data_store.scenario.time_start = time_start
    print(
        f'.     * When I start the clockwatch at {time_start.strftime("%H:%M:%S.%f")}')


@ step(["When I stop the clockwatch"])
def when_i_stop_the_clockwatch():
    time_start = data_store.scenario.time_start
    time_end = datetime.now()
    print(
        f'.     * When I stop the clockwatch at {time_end.strftime("%H:%M:%S.%f")} ({time_end - time_start})')


@ step(["Given I prepare before scenario",
       "Given I reset after scenario", "Debug", "TODO"])
def dummy():
    some = "thing"
