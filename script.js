const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'zigwangles';
const REPO_NAME = 'ZWF';
const TOKEN = 'your-personal-access-token'; // GitHub personal access token

// Initialize the admin panel
window.onload = () => {
    loadCategories();
    loadCategoriesForEditing();
};

// Load categories into select boxes
function loadCategories() {
    fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents`)
        .then(response => response.json())
        .then(data => {
            const categorySelect = document.getElementById('categorySelect');
            const editCategorySelect = document.getElementById('editCategorySelect');
            categorySelect.innerHTML = '';
            editCategorySelect.innerHTML = '';

            data.forEach(folder => {
                if (folder.type === 'dir') {
                    const option = document.createElement('option');
                    option.value = folder.name;
                    option.textContent = folder.name;
                    categorySelect.appendChild(option);

                    const editOption = document.createElement('option');
                    editOption.value = folder.name;
                    editOption.textContent = folder.name;
                    editCategorySelect.appendChild(editOption);
                }
            });
        });
}

// Create new category (folder)
function createCategory() {
    const categoryName = document.getElementById('newCategory').value;
    if (!categoryName) {
        alert('Please enter a category name.');
        return;
    }

    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${categoryName}/.gitkeep`;
    const body = {
        message: `Create category ${categoryName}`,
        content: btoa(''), // Empty file
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(() => {
        alert(`Category "${categoryName}" created!`);
        loadCategories();
        loadCategoriesForEditing();
    })
    .catch(error => console.error('Error creating category:', error));
}

// Create new tutorial (.md file)
function createTutorial() {
    const category = document.getElementById('categorySelect').value;
    const title = document.getElementById('tutorialTitle').value;
    const content = document.getElementById('tutorialContent').value;
    const filePath = `${category}/${title}.md`;

    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
    const body = {
        message: `Add new tutorial: ${title}`,
        content: btoa(content), // Convert content to base64
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(() => {
        alert(`Tutorial "${title}" created!`);
        loadTutorialsForEditing();
    })
    .catch(error => console.error('Error creating tutorial:', error));
}

// Load tutorials for editing/deleting
function loadTutorialsForEditing() {
    const category = document.getElementById('editCategorySelect').value;
    fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${category}`)
        .then(response => response.json())
        .then(data => {
            const tutorialSelect = document.getElementById('tutorialSelect');
            tutorialSelect.innerHTML = '';
            data.forEach(file => {
                if (file.name.endsWith('.md')) {
                    const option = document.createElement('option');
                    option.value = file.name;
                    option.textContent = file.name;
                    tutorialSelect.appendChild(option);
                }
            });
        });
}

// Load the content of a tutorial into the textarea for editing
document.getElementById('tutorialSelect').addEventListener('change', () => {
    const category = document.getElementById('editCategorySelect').value;
    const tutorial = document.getElementById('tutorialSelect').value;
    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${category}/${tutorial}`;

    fetch(url, {
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })
    .then(response => response.json())
    .then(data => {
        const content = atob(data.content); // Convert base64 to string
        document.getElementById('editTutorialContent').value = content;
    });
});

// Edit an existing tutorial
function editTutorial() {
    const category = document.getElementById('editCategorySelect').value;
    const tutorial = document.getElementById('tutorialSelect').value;
    const content = document.getElementById('editTutorialContent').value;
    const filePath = `${category}/${tutorial}`;

    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
    const body = {
        message: `Edit tutorial: ${tutorial}`,
        content: btoa(content), // Convert content to base64
        sha: getShaOfFile(filePath), // Fetch the SHA of the file to update it
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    })
    .then(response => response.json())
    .then(() => {
        alert(`Tutorial "${tutorial}" updated!`);
    })
    .catch(error => console.error('Error editing tutorial:', error));
}

// Delete a tutorial
function deleteTutorial() {
    const category = document.getElementById('editCategorySelect').value;
    const tutorial = document.getElementById('tutorialSelect').value;
    const filePath = `${category}/${tutorial}`;

    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
    const body = {
        message: `Delete tutorial: ${tutorial}`,
        sha: getShaOfFile(filePath), // Fetch the SHA of the file to delete it
    };

    fetch(url, {
        method: 'DELETE',
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    })
    .then(() => {
        alert(`Tutorial "${tutorial}" deleted!`);
        loadTutorialsForEditing();
    })
    .catch(error => console.error('Error deleting tutorial:', error));
}

// Helper to get the SHA of a file (required for editing/deleting)
function getShaOfFile(filePath) {
    return fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
        headers: {
            Authorization: `token ${TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })
    .then(response => response.json())
    .then(data => data.sha)
    .catch(error => console.error('Error fetching file SHA:', error));
}
