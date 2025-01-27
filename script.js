// Categories with corresponding GitHub folder paths
const CATEGORIES = {
    "Programming": "https://raw.githubusercontent.com/your-repo/programming/",
    "Web Development": "https://raw.githubusercontent.com/your-repo/web-development/",
    // Add more categories (30-50 categories in total)
};

// Element references
const categoriesDiv = document.getElementById('categories');
const tutorialContentDiv = document.getElementById('tutorial-content');
const searchInput = document.getElementById('search');

// Load categories
function loadCategories() {
    Object.keys(CATEGORIES).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('category');
        categoryDiv.innerText = category;
        categoryDiv.onclick = () => loadTutorials(category);
        categoriesDiv.appendChild(categoryDiv);
    });
}

// Load tutorials for a selected category
function loadTutorials(category) {
    const repoUrl = CATEGORIES[category];
    fetchGitHubFolder(repoUrl, category);
}

// Fetches a folder (category) from the GitHub repository
function fetchGitHubFolder(repoUrl, category) {
    // In a real case, you would fetch the repo files (or manually list them)
    // Let's simulate loading two .md files for now:
    const tutorial1Url = `${repoUrl}tutorial1.md`;
    const tutorial2Url = `${repoUrl}tutorial2.md`;

    displayTutorialList(category, [tutorial1Url, tutorial2Url]);
}

// Display list of tutorials for the selected category
function displayTutorialList(category, tutorialUrls) {
    tutorialContentDiv.innerHTML = `<h2>${category} Tutorials</h2>`;
    
    tutorialUrls.forEach(url => {
        const tutorialDiv = document.createElement('div');
        tutorialDiv.innerHTML = `<a href="#" onclick="loadTutorial('${url}')">${url.split('/').pop()}</a>`;
        tutorialContentDiv.appendChild(tutorialDiv);
    });
}

// Load and render a tutorial
function loadTutorial(url) {
    fetch(url)
        .then(response => response.text())
        .then(markdown => {
            const html = marked.parse(markdown);
            tutorialContentDiv.innerHTML = html;
        })
        .catch(error => {
            tutorialContentDiv.innerHTML = `<p>Error loading tutorial: ${error.message}</p>`;
        });
}

// Reveal admin panel if search matches the secret keyword
searchInput.addEventListener('input', (e) => {
    if (e.target.value === 'admin-access-keyword') {
        window.location.href = 'admin.html';
    }
});

// Initialize categories on page load
loadCategories();