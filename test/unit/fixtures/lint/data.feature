Feature: Data that looks like code

  Scenario: Quoted values that are data, not element names
    * I see the text ".NET Framework"
    * I fill "#hashtag" in the "Tweet" field
    * I see the attribute "href" with the value "https://github.com/x" on the "GitHub" link
    * I see the url containing "//cdn"
