// content.js

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Build a list of Good and Bad ingredients to display at script end
        var alertList = '--INGREDIENT CHECKER v' + request.version + '--\nThis product may contain:\n';

        // Set default flag for any matches
        var ingredientsFound = false;

        // User has clicked the extension icon - now we run our script
        if (request.message === "clicked_browser_action") {
            // Build our lists of ingredients as a JSON object
            var ingredientLists;
            var url = chrome.runtime.getURL('data/ingredients.json');
            $.getJSON(url, function (data) {    // Retrieve lists as JSON
                ingredientLists = data;

                // DEBUG- Log status to console
                console.log("Ingredient Checker is running.");

                // Crawl the page content and build our list of matching ingredients
                walk(document.body);

                // Crawl is done - display the ingredients
                if (!ingredientsFound) {
                    // We didn't find any ingredients so set the return message as such
                    alertList = '--INGREDIENT CHECKER v' + request.version + '--\nNo ingredients were found on this page.';
                }

                // Log the matches in the chrome console and send an alert window
                console.log(alertList);
                console.log("Ingredient Checker has finished running.");
                alert(alertList);
            });
        }

        function walk(node) {

            var child, next;

            var tagName = node.tagName ? node.tagName.toLowerCase() : "";
            if (tagName == 'input' || tagName == 'textarea') {
                return;
            }
            if (node.classList && node.classList.contains('ace_editor')) {
                return;
            }

            switch (node.nodeType) {
                case 1: // Element
                case 9: // Document
                case 11: // Document fragment
                    child = node.firstChild;
                    while (child) {
                        next = child.nextSibling;
                        walk(child);
                        child = next;
                    }
                    break;

                case 3: // Text node
                    if (node.nodeValue.trim().length >= 5 && node.parentElement != null) {
                        if (node.parentElement.nodeName.toLowerCase() != "script") {
                            evaluate(node);
                        }
                    }
                    break;
            }
        }

        function evaluate(textNode) {
            var parent = "";
            // Get the raw HTML of the parent element from the text node
            parent = textNode.parentElement.innerHTML;

            // Check the text node against our lists
            for (var l = 0; l < ingredientLists.lists.length; l++) {
                var list = ingredientLists.lists[l];
                parent = ingredientScan(parent, list.ingredients, list.color, list.name);
            }

            // Replace the HTML with our marked-up html
            textNode.parentElement.innerHTML = parent;
        }

        // Check the ingredients within the html block
        function ingredientScan(parent, listToCheck, textHighlightColor, typeOfIngredient) {
            var regex;
            var ingredient;

            // Loop through ingredients and match against our HTML chunk
            for (var g = 0; g < listToCheck.length; g++) {
                ingredient = listToCheck[g]; // Set current ingredient
                regex = new RegExp("\\s+" + ingredient, "gi"); //Build our regex - Case insensitive
                if (parent.match(regex) != null) {
                    // If we have a match, update the html with highlighted text
                    parent = parent.replace(regex, "<strong style=\"background-color:" + textHighlightColor + ";\"> " + ingredient + "</strong>");
                    // Set our flag and log the ingredient to our alert list
                    ingredientsFound = true;
                    alertList += typeOfIngredient + ' INGREDIENT: ' + ingredient + '\n';
                }
            }

            return parent;
        }
    }
);