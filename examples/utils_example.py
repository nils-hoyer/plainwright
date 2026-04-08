import operator
import re


class Utils:

    @staticmethod
    def string_to_property_name(property_as_string):
        return str(property_as_string).lower().strip().replace(" ", "_")

    @staticmethod
    def string_to_dict_key(dict_key_as_string):
        return str(dict_key_as_string).lower().strip().replace(" ", "_")

    @staticmethod
    def get_class_property(obj, property_as_string):
        property_name = Utils.string_to_property_name(property_as_string)
        try:
            return getattr(obj, property_name)
        except AttributeError as attribute_error:
            raise AttributeError(
                f"variable '{property_name}' not found in page object '{Utils.camel_case_to_snake_case(obj.__class__.__name__)}.py'") from attribute_error

    @staticmethod
    def camel_case_to_snake_case(name):
        # https://stackoverflow.com/questions/1175208/elegant-python-function-to-convert-camelcase-to-snake-case
        return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()

    @staticmethod
    def string_to_money(text):
        # replace everything except numbers and comma. replace , with . for float()
        # "123.456,78 €" -> 123456,78
        return float(
            re.sub(r"(\.| |€)", "", text).replace(",", "."))

    @staticmethod
    def compare(given_value, _operator, expected_value):
        _operator = _operator.lower()

        operations = {
            "greater": operator.gt,
            "lower": operator.lt,
            "equals": operator.eq}

        return operations[_operator](given_value, expected_value)

    @staticmethod
    def get_resolution(resolution_string):
        return {
            "width": int(resolution_string.split("x")[0]),
            "height": int(resolution_string.split("x")[1])
        }

    @staticmethod
    def xpath_by_class(_class):
        return f"[contains(concat(' ', normalize-space(@class), ' '), ' {_class} ')]"

    @staticmethod
    def normalize_string(string):
        # replace linkebreaks
        string = re.sub("(\\r\\n|\\r|\\n)", " ", string, 0, re.MULTILINE)
        # place unicodes
        string = re.sub("(\\xa0)", " ", string, 0, re.MULTILINE)
        # replace multiple whitespace
        string = re.sub("\\s{2,}", " ", string, 0, re.MULTILINE)
        return string
