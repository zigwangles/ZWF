// GitHub configuration
const GITHUB_TOKEN = process.env.ZWF_TOKEN; // Using the ZWF_Token environment variable
const REPO_OWNER = 'zigwangles';
const REPO_NAME = 'ZWF';
const ADMIN_KEY = 'rimurutempest123!'; // Change this to your desired admin key

// GitHub API endpoints
const GITHUB_API = 'https://api.github.com';
const REPO_URL = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`;

// State management
let categories = [];
let tutorials = [];

// Initialize the application
async function init() {
    if (!process.env.ZWF_TOKEN) {
        console.error('GitHub token (ZWF_TOKEN) is not set in environment variables');
        return;
    }
    await loadCategories();
    await loadTutorials();
    setupEventListeners();
}

// Load categories from GitHub
async function loadCategories() {
    try {
        const response = await fetch(`${REPO_URL}/contents/categories.json`, {
            headers: {
                'Authorization': `token ${process.env.ZWF_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            categories = JSON.parse(atob(data.content));
            renderCategories();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load tutorials from GitHub
async function loadTutorials() {
    try {
        const response = await fetch(`${REPO_URL}/contents/tutorials`, {
            headers: {
                'Authorization': `token ${process.env.ZWF_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const files = await response.json();
            tutorials = await Promise.all(
                files.map(async file => {
                    const content = await fetch(file.download_url).then(res => res.text());
                    return {
                        name: file.name,
                        content: content,
                        category: file.name.split('-')[0]
                    };
                })
            );
            renderTutorials();
        }
    } catch (error) {
        console.error('Error loading tutorials:', error);
    }
}

// Render categories in the sidebar
function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = categories.map(category => `
        <div class="category-item" onclick="filterTutorials('${category}')">
            ${category}
        </div>
    `).join('');

    // Update category dropdowns in admin panel
    const categorySelects = document.querySelectorAll('select[id$="Category"]');
    categorySelects.forEach(select => {
        select.innerHTML = categories.map(category => `
            <option value="${category}">${category}</option>
        `).join('');
    });
}

// Render tutorials in the grid
function renderTutorials(filteredTutorials = tutorials) {
    const tutorialsGrid = document.getElementById('tutorialsGrid');
    tutorialsGrid.innerHTML = filteredTutorials.map(tutorial => `
        <div class="tutorial-card">
            <h3>${tutorial.name.replace('.md', '').split('-').slice(1).join(' ')}</h3>
            <p>${tutorial.content.slice(0, 150)}...</p>
            <button onclick="viewTutorial('${tutorial.name}')">Read More</button>
        </div>
    `).join('');
}

// Filter tutorials by category
function filterTutorials(category) {
    const filtered = tutorials.filter(tutorial => tutorial.category === category);
    renderTutorials(filtered);
}

// View full tutorial
function viewTutorial(tutorialName) {
    const tutorial = tutorials.find(t => t.name === tutorialName);
    if (tutorial) {
        const content = marked(tutorial.content);
        // Show tutorial in a modal or new page
        // Implementation depends on your preferred UI
    }
}

// Admin panel functions
function handleCategory() {
    const categoryName = document.getElementById('categoryName').value;
    if (categoryName) {
        categories.push(categoryName);
        updateCategoriesFile();
    }
}

function handleTutorial() {
    const title = document.getElementById('tutorialTitle').value;
    const category = document.getElementById('tutorialCategory').value;
    const content = document.getElementById('tutorialContent').value;
    
    if (title && category && content) {
        const fileName = `${category}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
        createTutorialFile(fileName, content);
    }
}

async function deleteTutorial() {
    const tutorialName = document.getElementById('tutorialToDelete').value;
    if (tutorialName) {
        await deleteTutorialFile(tutorialName);
    }
}

// GitHub API functions
async function updateCategoriesFile() {
    try {
        const content = btoa(JSON.stringify(categories));
        await fetch(`${REPO_URL}/contents/categories.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${process.env.ZWF_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Update categories',
                content: content,
                sha: await getFileSha('categories.json')
            })
        });
        
        await loadCategories();
    } catch (error) {
        console.error('Error updating categories:', error);
    }
}

async function createTutorialFile(fileName, content) {
    try {
        await fetch(`${REPO_URL}/contents/tutorials/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${process.env.ZWF_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Create tutorial',
                content: btoa(content)
            })
        });
        
        await loadTutorials();
    } catch (error) {
        console.error('Error creating tutorial:', error);
    }
}

async function deleteTutorialFile(fileName) {
    try {
        await fetch(`${REPO_URL}/contents/tutorials/${fileName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${process.env.ZWF_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Delete tutorial',
                sha: await getFileSha(`tutorials/${fileName}`)
            })
        });
        
        await loadTutorials();
    } catch (error) {
        console.error('Error deleting tutorial:', error);
    }
}

async function getFileSha(path) {
    const response = await fetch(`${REPO_URL}/contents/${path}`, {
        headers: {
            'Authorization': `token ${process.env.ZWF_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    const data = await response.json();
    return data.sha;
}

// Event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value === ADMIN_KEY) {
            document.getElementById('adminPanel').classList.add('active');
        } else {
            document.getElementById('adminPanel').classList.remove('active');
            // Implement tutorial search functionality here
        }
    });
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);