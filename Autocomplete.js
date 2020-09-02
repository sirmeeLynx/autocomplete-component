export default class Autocomplete {
   
  constructor(rootEl, options = {}) {
    options = Object.assign({ numOfResults: 10, data: [] }, options);
    this.currentListItem = 0;
    this.listLi = null;
    Object.assign(this, { rootEl, options });
    this.init();
  }

  async onQueryChange(query) {
    // Get data for the dropdown
    let { data, numOfResults } = this.options;
    let results = await this.getResults(query, data);
    results = (results.length != numOfResults) ? results.slice(0, this.options.numOfResults) : results;
    
    this.updateDropdown(results);
  }

  async fetchGithubUsers(query){
    if (!query) return [];
    const numOfResults = this.options.numOfResults;
    const result = await fetch(`https://api.github.com/search/users?q=${query}&per_page=${numOfResults}`)
                        .then(json=>json.json())
                        .then(res=>res.items.map(user => ({
                          text: user.login,
                          value: user.id
                        })));
    console.log(result);
    return result;
  }
  /**
   * Given an array and a query, return a filtered array based on the query.
   * Not Given an array, return Github Users that maches query
   */
  async getResults(query, data) {
    if (!query) return [];

    if (!data){
      // Github Users
      return this.fetchGithubUsers(query);
    }

    // Filter for matching strings
    let results = data.filter((item) => {
      return item.text.toLowerCase().includes(query.toLowerCase());
    });

    return results;
  }

  updateDropdown(results) {
    this.listEl.innerHTML = '';
    this.listEl.appendChild(this.createResultsEl(results));
  }

  createResultsEl(results) {
    const fragment = document.createDocumentFragment();
    results.forEach((result) => {
      const el = document.createElement('li');
      Object.assign(el, {
        className: 'result',
        textContent: result.text,
      });

      // Pass the value to the onSelect callback
      el.addEventListener('click', (event) => {
        const { onSelect } = this.options;
        if (typeof onSelect === 'function') onSelect(result.value);
        this.inputEl.value = result.text;
        this.listEl.setAttribute("hidden","");
      });

      fragment.appendChild(el);
    });
    
    /* Set listLi to the list of newly generated Li's
    *  and reset currently selected Elem to 0
    */
    this.listLi = fragment.querySelectorAll("li");
    this.currentListItem = 0;

    return fragment;
  }

  createQueryInputEl() {
    const inputEl = document.createElement('input');
    Object.assign(inputEl, {
      type: 'search',
      name: 'query',
      autocomplete: 'off',
    });

    inputEl.addEventListener('input', event => 
      this.onQueryChange(event.target.value));

    inputEl.addEventListener("focus", event => this.listEl.removeAttribute("hidden",""))

    inputEl.addEventListener("keydown", event => {
      let { listLi, currentListItem } = this;
      // Check for up/down key presses
      switch(event.keyCode){
        case 38: // Up arrow    
          // Remove the highlighting from the previous element
          listLi[currentListItem].classList.remove("active");
          
          currentListItem = currentListItem > 0 ? --currentListItem : 0;     // Decrease the counter     
          this.currentListItem = currentListItem; //update field 
          listLi[currentListItem].classList.add("active"); // Highlight the new element
          break;
        case 40: // Down arrow
          // Remove the highlighting from the previous element
          listLi[currentListItem].classList.remove("active");
          
          currentListItem = currentListItem < listLi.length-1 ? ++currentListItem : listLi.length-1; // Increase counter 
          this.currentListItem = currentListItem; //update field
          listLi[currentListItem].classList.add("active");       // Highlight the new element
          break;    
        case 13: // Enter key
          // Trigger click event on the selected li element
          listLi[currentListItem].click();
          break;    
      }

    })
    return inputEl;
  }

  
  init() {
    // Build query input
    this.inputEl = this.createQueryInputEl();
    this.rootEl.appendChild(this.inputEl)

    // Build results dropdown
    this.listEl = document.createElement('ul');
    Object.assign(this.listEl, { className: 'results' });
    this.rootEl.appendChild(this.listEl);
  }
}
