import { getResultData } from './script_data.js';

async function fetchAndDisplay(index) {
    const data = await getResultData(index);
    if(data.error) {
        showError(data.error);
    } else {
        displayResults(data);
    }
}
