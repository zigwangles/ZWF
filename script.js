// Firebase configuration - Replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyA-haa3-HOFU9xaZ4OOViuJ5ZaPfhEHrMM",
  authDomain: "zwf-forums.firebaseapp.com",
  projectId: "zwf-forums",
  storageBucket: "zwf-forums.firebasestorage.app",
  messagingSenderId: "530467664249",
  appId: "1:530467664249:web:4bc68a0e1c1de83b7c7fa8",
  measurementId: "G-MZ4G3PB7NN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const md = new Remarkable();

// Admin access configuration
const ADMIN_ACCESS_CODE = "jeephehe"; // Change this to your desired access code

// Event Listeners
document.getElementById('adminAccess').addEventListener('input', function(e) {
    if (e.target.value === ADMIN_ACCESS_CODE) {
        document.getElementById('adminPanel').classList.remove('hidden');
    } else {
        document.getElementById('adminPanel').classList.add('hidden');
    }
});

// Categories Management
async function createCategory() {
    const categoryName = document.getElementById('newCategoryName').value;
    if (!categoryName) return;

    try {
        await db.collection('categories').add({
            name: categoryName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('newCategoryName').value = '';
        loadCategories();
    } catch (error) {
        console.error("Error creating category:", error);
    }
}

async function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const categorySelect = document.getElementById('categorySelect');
    
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        
        // Clear existing categories
        categoriesList.innerHTML = '';
        categorySelect.innerHTML = '';
        
        snapshot.forEach(doc => {
            // Add to categories grid
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <h3>${doc.data().name}</h3>
            `;
            categoryCard.onclick = () => loadTutorialsByCategory(doc.id);
            categoriesList.appendChild(categoryCard);

            // Add to select dropdown in admin panel
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Tutorials Management
async function createTutorial() {
    const categoryId = document.getElementById('categorySelect').value;
    const title = document.getElementById('tutorialTitle').value;
    const content = document.getElementById('tutorialContent').value;

    if (!categoryId || !title || !content) return;

    try {
        await db.collection('tutorials').add({
            categoryId,
            title,
            content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('tutorialTitle').value = '';
        document.getElementById('tutorialContent').value = '';
        loadTutorialsByCategory(categoryId);
    } catch (error) {
        console.error("Error creating tutorial:", error);
    }
}

async function loadTutorialsByCategory(categoryId) {
    const tutorialsList = document.getElementById('tutorialsList');
    
    try {
        const snapshot = await db.collection('tutorials')
            .where('categoryId', '==', categoryId)
            .orderBy('timestamp', 'desc')
            .get();
        
        tutorialsList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const tutorialCard = document.createElement('div');
            tutorialCard.className = 'tutorial-card';
            tutorialCard.innerHTML = `
                <h3>${doc.data().title}</h3>
                <button onclick="viewTutorial('${doc.id}')">Read</button>
                ${isAdmin() ? `
                    <button onclick="editTutorial('${doc.id}')">Edit</button>
                    <button onclick="deleteTutorial('${doc.id}')">Delete</button>
                ` : ''}
            `;
            tutorialsList.appendChild(tutorialCard);
        });
    } catch (error) {
        console.error("Error loading tutorials:", error);
    }
}

async function viewTutorial(tutorialId) {
    try {
        const doc = await db.collection('tutorials').doc(tutorialId).get();
        const tutorial = doc.data();
        
        const modal = document.getElementById('tutorialModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = tutorial.title;
        modalContent.innerHTML = md.render(tutorial.content);
        modal.style.display = 'block';
    } catch (error) {
        console.error("Error viewing tutorial:", error);
    }
}

async function editTutorial(tutorialId) {
    try {
        const doc = await db.collection('tutorials').doc(tutorialId).get();
        const tutorial = doc.data();
        
        document.getElementById('tutorialTitle').value = tutorial.title;
        document.getElementById('tutorialContent').value = tutorial.content;
        document.getElementById('categorySelect').value = tutorial.categoryId;
        
        // Add update button
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Tutorial';
        updateButton.onclick = async () => {
            await updateTutorial(tutorialId);
            updateButton.remove();
        };
        document.querySelector('.admin-section').appendChild(updateButton);
    } catch (error) {
        console.error("Error editing tutorial:", error);
    }
}

async function updateTutorial(tutorialId) {
    const categoryId = document.getElementById('categorySelect').value;
    const title = document.getElementById('tutorialTitle').value;
    const content = document.getElementById('tutorialContent').value;

    try {
        await db.collection('tutorials').doc(tutorialId).update({
            categoryId,
            title,
            content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('tutorialTitle').value = '';
        document.getElementById('tutorialContent').value = '';
        loadTutorialsByCategory(categoryId);
    } catch (error) {
        console.error("Error updating tutorial:", error);
    }
}

async function deleteTutorial(tutorialId) {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
        await db.collection('tutorials').doc(tutorialId).delete();
        loadTutorialsByCategory(document.getElementById('categorySelect').value);
    } catch (error) {
        console.error("Error deleting tutorial:", error);
    }
}

// Utility Functions
function isAdmin() {
    return !document.getElementById('adminPanel').classList.contains('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    
    // Modal close button
    document.querySelector('.close-button').onclick = () => {
        document.getElementById('tutorialModal').style.display = 'none';
    };
});