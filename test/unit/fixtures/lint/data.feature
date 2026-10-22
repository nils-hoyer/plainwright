Feature: Data that looks like code

  Scenario: Quoted values that are data, not element names
    * I see the text ".NET Framework"
    * I fill "#hashtag" in the "Tweet" field
    * I see the "GitHub" link leads to "https://github.com/x"
    * I see the url containing "//cdn"
