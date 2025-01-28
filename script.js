import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";


const firebaseConfig = {
    apiKey: "AIzaSyA-haa3-HOFU9xaZ4OOViuJ5ZaPfhEHrMM",
    authDomain: "zwf-forums.firebaseapp.com",
    projectId: "zwf-forums",
    storageBucket: "zwf-forums.firebasestorage.app",
    messagingSenderId: "530467664249",
    appId: "1:530467664249:web:4bc68a0e1c1de83b7c7fa8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const categoriesCollection = collection(db, "categories");
const tutorialsCollection = collection(db, "tutorials");
const adminPassword = "adminpassword"; // Replace with a more secure approach in prod

const adminPanel = document.getElementById('adminPanel');
const searchInput = document.getElementById('searchInput');
const forumContainer = document.getElementById('forumContainer');


// Admin Panel Elements
const newCategoryNameInput = document.getElementById('newCategoryName');
const addCategoryButton = document.getElementById('addCategoryButton');
const tutorialTitleInput = document.getElementById('tutorialTitle');
const tutorialCategorySelect = document.getElementById('tutorialCategory');
const markdownFileInput = document.getElementById('markdownFile');
const uploadTutorialButton = document.getElementById('uploadTutorialButton');
const editTutorialSelect = document.getElementById('editTutorialSelect');
const editFormContainer = document.getElementById('editFormContainer');
const editTutorialTitleInput = document.getElementById('editTutorialTitle');
const editTutorialCategorySelect = document.getElementById('editTutorialCategory');
const editMarkdownContentTextarea = document.getElementById('editMarkdownContent');
const updateTutorialButton = document.getElementById('updateTutorialButton');
const deleteTutorialButton = document.getElementById('deleteTutorialButton');


// Helper Functions
async function fetchCategories() {
    const querySnapshot = await getDocs(categoriesCollection);
    const categories = [];
    querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
    });
    return categories;
}

async function fetchTutorials() {
    const querySnapshot = await getDocs(tutorialsCollection);
    const tutorials = [];
    querySnapshot.forEach((doc) => {
        tutorials.push({ id: doc.id, ...doc.data() });
    });
    return tutorials;
}

function renderTutorialMarkdown(markdown) {
    return marked.parse(markdown);
}

function displayCategories(categories) {
        tutorialCategorySelect.innerHTML = '<option value="">Select Category</option>';
        editTutorialCategorySelect.innerHTML = '<option value="">Select Category</option>';

    categories.forEach((category) => {
        tutorialCategorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        editTutorialCategorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
    });
}

function displayTutorials(tutorials, categories) {
      forumContainer.innerHTML = "";

    tutorials.forEach((tutorial) => {
        // Construct category names for the tutorial
        let categoryNames = tutorial.categoryIds
        ? tutorial.categoryIds.map(categoryId => {
            const foundCategory = categories.find(cat => cat.id === categoryId);
            return foundCategory ? foundCategory.name : "Unknown Category";
        }).join(", ")
        : "No Categories";
        
        const tutorialHTML = `
            <div class="bg-white shadow-md rounded p-4">
                <h2 class="text-xl font-bold mb-2">${tutorial.title}</h2>
                <p class="text-gray-600 mb-2">Categories: ${categoryNames}</p>
                <div class="markdown-body">${renderTutorialMarkdown(tutorial.markdownContent)}</div>
            </div>
        `;
        forumContainer.innerHTML += tutorialHTML;
    });
}

async function refreshTutorials(){
     const categories = await fetchCategories();
        const tutorials = await fetchTutorials();
        displayCategories(categories);
        displayTutorials(tutorials,categories);
    
}

async function updateEditTutorialSelect(){
    const tutorials = await fetchTutorials();
    editTutorialSelect.innerHTML = '<option value="">Select Tutorial to Edit/Delete</option>';

    tutorials.forEach((tutorial) => {
        editTutorialSelect.innerHTML += `<option value="${tutorial.id}">${tutorial.title}</option>`;
      });
}

// Event Listeners

searchInput.addEventListener('input', () => {
    if (searchInput.value === "admin") {
       adminPanel.classList.remove('hidden');
    }else{
        adminPanel.classList.add('hidden');
    }
});

addCategoryButton.addEventListener('click', async () => {
  const categoryName = newCategoryNameInput.value;
  if(categoryName){
    await addDoc(categoriesCollection, { name: categoryName });
    newCategoryNameInput.value = "";
     refreshTutorials();
  }
});

uploadTutorialButton.addEventListener('click', async () => {
    const title = tutorialTitleInput.value;
    const categoryId = tutorialCategorySelect.value;
    const file = markdownFileInput.files[0];

    if (!title || !categoryId || !file) {
        alert("Please fill in all fields.");
        return;
    }
    if(!file.name.endsWith('.md')){
        alert("Please upload a valid .md file.");
        return;
    }


     const reader = new FileReader();
    reader.onload = async function(event) {
            const markdownContent = event.target.result;

            await addDoc(tutorialsCollection, {
             title: title,
             categoryIds: [categoryId],
             markdownContent: markdownContent,
             timestamp: new Date(),
            });

           tutorialTitleInput.value = "";
           tutorialCategorySelect.value = "";
           markdownFileInput.value = "";
           refreshTutorials();
           updateEditTutorialSelect()
       };
       reader.readAsText(file);

});

editTutorialSelect.addEventListener('change', async function(){
    const selectedTutorialId = this.value;
      if (selectedTutorialId) {
            editFormContainer.classList.remove('hidden');

            const tutorialDoc = await getDoc(doc(db, "tutorials", selectedTutorialId));
             if(tutorialDoc.exists()){
            const tutorialData = tutorialDoc.data();
            editTutorialTitleInput.value = tutorialData.title;
            editTutorialCategorySelect.value = tutorialData.categoryIds ? tutorialData.categoryIds[0] : "";
            editMarkdownContentTextarea.value = tutorialData.markdownContent;
        }
      } else {
        editFormContainer.classList.add('hidden');
      }
});

updateTutorialButton.addEventListener('click', async () => {
  const selectedTutorialId = editTutorialSelect.value;
    if (!selectedTutorialId) {
      alert("Please select a tutorial to update.");
      return;
    }
    const updatedTitle = editTutorialTitleInput.value;
    const updatedCategoryId = editTutorialCategorySelect.value;
    const updatedMarkdownContent = editMarkdownContentTextarea.value;

    if (!updatedTitle || !updatedCategoryId || !updatedMarkdownContent) {
      alert("Please fill all fields to update.");
      return;
    }

    try{
      await updateDoc(doc(db,"tutorials", selectedTutorialId), {
        title: updatedTitle,
        categoryIds: [updatedCategoryId],
        markdownContent: updatedMarkdownContent,
      });
      editFormContainer.classList.add('hidden');
      refreshTutorials();
      updateEditTutorialSelect();
        alert("Tutorial Updated");

    }catch(error){
        console.log(error);
        alert("Error occured while updating")
    }

});

deleteTutorialButton.addEventListener('click', async () => {
    const selectedTutorialId = editTutorialSelect.value;
    if (!selectedTutorialId) {
      alert("Please select a tutorial to delete.");
      return;
    }

    try {
        await deleteDoc(doc(db, "tutorials", selectedTutorialId));
        editFormContainer.classList.add('hidden');
        refreshTutorials();
         updateEditTutorialSelect();
      alert("Tutorial Deleted");

    } catch(error){
        console.log(error);
         alert("Error occured while deleting")

    }
});


// Initial Load
async function init(){
     
    const categories = await fetchCategories();
    const tutorials = await fetchTutorials();
    displayCategories(categories);
    displayTutorials(tutorials,categories);
    updateEditTutorialSelect();
    
}

init();