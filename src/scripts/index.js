import '../styles/index.scss';
import 'flatpickr/dist/themes/dark.css';
import { KEYS } from '../../client_id.js';
import flatpickr from 'flatpickr';
import { Russian as rusLocale } from 'flatpickr/dist/l10n/ru.js';

// Client ID and API key from the Developer Console
const CLIENT_ID = KEYS.CLIENT_ID;
const API_KEY = KEYS.API_KEY;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');

document.onload = handleClientLoad();

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

const updateTable = selectedDates => {
    if (selectedDates.length === 2) {
        listUpcomingEvents(...selectedDates);
    }
};

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        
        flatpickr(document.getElementById('datepicker'), {
            mode: "range",
            locale: rusLocale,
            altInput: true,
            altFormat: "j F",
            maxDate: new Date().setDate(new Date().getDate() + 1),
            defaultDate: [
                new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
                new Date()
            ],
            onReady: updateTable,
            onChange: updateTable,
        });

    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string[]} messages array for each td
 */
function appendNewRows(...tds) {
    const table = document.getElementById('content');
    const tr = document.createElement('tr');
    
    tds.forEach(td => {
        const tdEl = document.createElement('td');
        tdEl.innerText = td;
        tr.appendChild(tdEl);
    });

    table.appendChild(tr);
}

/**
 * Clear table.
 */
function clearTable() {
    const table = document.getElementById('content');
    table.innerHTML = '';
}

/**
 * Print the withWho and duration of the the lessons in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents(startDate, endDate) {
    gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 30,
        'timeMin': startDate.toISOString(),
        'timeMax': endDate.toISOString(),
        'orderBy': 'startTime'
    }).then(response => {
        clearTable();
        const events = response.result.items;

        if (events.length > 0) {
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                const duration = (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 1000 / 60 / 60;

                let postfix = 'час';
                if (duration > 1 && duration < 5) {
                    postfix += 'а';
                } else if (duration >= 5) {
                    postfix += 'ов';
                }
                
                appendNewRows(
                    event.summary, 
                    duration + ' ' + postfix, 
                    new Date(event.start.dateTime).toLocaleString([], {
                        hour: '2-digit', 
                        minute:'2-digit'
                    }
                ));
            }
        } else {
            appendNewRows('No lessons found.');
        }
    });
}
