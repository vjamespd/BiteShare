// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE7qswXLivIC0VR4BmJBUy6XmbK2cC9uU",
  authDomain: "bitesharechat.firebaseapp.com",
  projectId: "bitesharechat",
  storageBucket: "bitesharechat.firebasestorage.app",
  messagingSenderId: "182207835443",
  appId: "1:182207835443:web:76b2b40fd3acd99d66a246",
};

let app, storage, db;
let isUploading = false;
let likesCount = 509; // initial likes count
let isLiked = false; // initial like status

// Initialize Firebase after DOM loads
document.addEventListener("DOMContentLoaded", function () {
  try {
    app = firebase.initializeApp(firebaseConfig);
    storage = firebase.storage();
    db = firebase.firestore();
    console.log("Firebase initialized successfully");
    loadImagesFromFirebase(); // Load images after Firebase is initialized
  } catch (error) {
    console.error("Firebase initialization error:", error);
    alert("Error initializing app. Please try again later.");
  }
});

// Modal Management Functions
function openModal() {
  document.getElementById("uploadModal").classList.add("show");
}

function closeModal() {
  document.getElementById("uploadModal").classList.remove("show");
  resetUploadView();
}


function resetUploadView() {
  document.querySelector(".upload-placeholder").style.display = "block";
  document.getElementById("preview-container").style.display = "none";
  document.querySelector(".preview-grid").innerHTML = "";
  document.getElementById("file-input").value = "";
  document.querySelector(".recipe-caption").style.display = "none";
  document.querySelector(".recipe-caption").value = "";
  document.getElementById("upload-final").style.display = "none";
  document.querySelector(".user-info").style.display = "none";
  hideBorder();
}

function hideBorder() {
  const div = document.querySelector(".upload-border");
  if (div) div.style.border = "none";
}

// Setup Event Listeners
document.querySelector(".select-btn")?.addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document.querySelector(".add-more-btn")?.addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document
  .getElementById("file-input")
  ?.addEventListener("change", handleFileChange);
document
  .getElementById("upload-final")
  ?.addEventListener("click", handleFinalUpload);

// File Input Change Handler
function handleFileChange(event) {
  if (isUploading) return;
  isUploading = true;

  const files = event.target.files;
  if (!files || files.length === 0) {
    isUploading = false;
    return;
  }

  try {
    document.querySelector(".upload-placeholder").style.display = "none";
    document.getElementById("preview-container").style.display = "block";
    document.querySelector(".recipe-caption").style.display = "block";
    document.getElementById("upload-final").style.display = "block";
    document.querySelector(".user-info").style.display = "flex";

    const previewGrid = document.querySelector(".preview-grid");
    previewGrid.classList.toggle("single-image", files.length === 1);

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const previewCard = document.createElement("div");
        previewCard.className = "preview-card";

        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Preview";
        img.className = "preview-image";

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.className = "remove-preview";
        removeBtn.onclick = () => {
          previewCard.remove();
          if (previewGrid.children.length === 0) {
            resetUploadView();
          }
        };

        previewCard.appendChild(img);
        previewCard.appendChild(removeBtn);
        previewGrid.appendChild(previewCard);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error handling file selection:", error);
    alert("Error previewing images. Please try again.");
  } finally {
    isUploading = false;
  }
}

// Final Upload Handler
async function handleFinalUpload() {
  if (!storage || !db) {
    alert("Firebase not initialized. Please refresh the page.");
    return;
  }

  const uploadBtn = document.getElementById("upload-final");
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    const caption = document.querySelector(".recipe-caption").value;
    const previews = document.querySelectorAll(".preview-card img");

    if (previews.length === 0) {
      alert("Please select at least one image");
      return;
    }

    const uploadPromises = Array.from(previews).map(async (preview) => {
      const file = preview.src;
      const storageRef = storage
        .ref()
        .child(
          `images/${Date.now()}-${Math.random().toString(36).substring(7)}`
        );
      const snapshot = await storageRef.putString(file, "data_url");
      return snapshot.ref.getDownloadURL();
    });

    const urls = await Promise.all(uploadPromises);

    const batch = db.batch();
    urls.forEach((url) => {
      const docRef = db.collection("images").doc();
      batch.set(docRef, {
        image: url,
        caption: caption,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // Add post to news feed
    const postDiv = document.querySelector(".post");
    const username = localStorage.getItem("username");
    urls.forEach((url) => {
      const imgElement = document.createElement("img");
      const captionElement = document.createElement("p");
      const imageContainer = document.createElement("div");

      imgElement.src = url;
      imgElement.alt = "Uploaded Image";
      imgElement.style.display = "block"; 
      imgElement.className = "post-image"; 

      captionElement.textContent = caption; 
      imageContainer.className = "image-container"; 
      imageContainer.appendChild(imgElement); 

      postDiv.appendChild(captionElement);
      postDiv.appendChild(imageContainer); 
    });



    closeModal();
    resetUploadView();
    alert("Upload complete!");
  } catch (error) {
    console.error("Upload error:", error);
    alert("Error uploading images. Please try again.");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "POST";
  }
}

// Store username after login
function login(username) {
  localStorage.setItem("username", username);
  localStorage.setItem("profilePicUrl", "path/to/profile-pic.jpg"); 
// Example profile picture URL
}
function getLoggedInUsername() {
  return localStorage.getItem("username") || "Anonymous";
}

function getLoggedInUserProfilePic() {
  return localStorage.getItem("profilePicUrl") || "/icons/Profilepic.png"; // Default profile pic URL
}

// Add image to news feed- remove caption from grid items
function addPostToNewsFeed(imageUrl, caption) {
  const postContainer = document.querySelector(".post-container");
  const username = getLoggedInUsername(); // Get the logged-in username
  const profilePicUrl = getLoggedInUserProfilePic(); // Get the logged-in user's profile picture URL

  const postElement = document.createElement("div");
  postElement.className = "post";

  // Create a parent div for user profile and username
  const userProfileElement = document.createElement("div");
  userProfileElement.className = "user-profile";

  const userInfoElement = document.createElement("div");
  userInfoElement.className = "user-info";

  const userAvatar = document.createElement("img");
  userAvatar.src = profilePicUrl;
  userAvatar.alt = "User Profile Picture";
  userAvatar.className = "user-avatar";

  const usernameElement = document.createElement("h3");
  usernameElement.textContent = username;
  usernameElement.className = "username";

  const captionElement = document.createElement("p");
  captionElement.textContent = caption;
  captionElement.className = "post-caption";

  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";

  const imgElement = document.createElement("img");
  imgElement.src = imageUrl;
  imgElement.alt = "Uploaded Image";
  imgElement.className = "post-image";
  imgElement.style.display = "block"; // Ensure the image is displayed

  const postActions = document.createElement("div");
  postActions.className = "post-actions";


  // Append elements to user profile
  userInfoElement.appendChild(userAvatar);
  userInfoElement.appendChild(usernameElement);
  userProfileElement.appendChild(userInfoElement);

  // Append elements to the post
  imageContainer.appendChild(imgElement);
  postElement.appendChild(userProfileElement);
  postElement.appendChild(captionElement);
  postElement.appendChild(imageContainer);
  postElement.appendChild(postActions);

  // Append the post to the post container
  postContainer.appendChild(postElement);
}



// Function to open preview modal - update to show caption and handle likes
function openPreviewModal(imageUrl, caption) {
  const previewModal = document.querySelector(".preview-modal");
  const previewImage = previewModal.querySelector(".previewmodal-image img");
  const captionElement = previewModal.querySelector("#imageCaption");
  const likeButton = previewModal.querySelector(
    ".previewaction-btn .fa-utensils"
  );
  const likesElement = previewModal.querySelector(
    ".previewliked-by strong:last-child"
  );
  const username = localStorage.getItem("username") || "Anonymous";
  const commentInput = previewModal.querySelector(".comment-text-input");
  const postButton = previewModal.querySelector(".previewpost-btn");

  postButton.replaceWith(postButton.cloneNode(true));
  const newPostButton = previewModal.querySelector(".previewpost-btn");

  newPostButton.addEventListener("click", () => handleCommentSubmit(imageUrl));

  // Add enter key functionality for comment input
  commentInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(imageUrl);
    }
  });

  // Update username in preview modal
  const userDetailsName = previewModal.querySelector(".previewuser-details h3");
  if (userDetailsName) {
    userDetailsName.textContent = username;
  }

  // Set image and caption with username
  previewImage.src = imageUrl;
  captionElement.innerHTML = `<strong>${username}</strong> ${caption}`;
  previewModal.style.display = "block";

  // Initialize like button state
  const isLiked = localStorage.getItem(`liked_${imageUrl}`) === "true";
  if (isLiked) {
    likeButton.style.color = "#8ab660";
  } else {
    likeButton.style.color = "inherit";
  }

  // Add like button click handler
  likeButton.parentElement.onclick = function () {
    const currentlyLiked = localStorage.getItem(`liked_${imageUrl}`) === "true";
    const newLikeState = !currentlyLiked;

    // Update like state
    localStorage.setItem(`liked_${imageUrl}`, newLikeState);

    // Update like button appearance
    if (newLikeState) {
      likeButton.style.color = "#8ab660";
      likesCount++;
    } else {
      likeButton.style.color = "inherit";
      likesCount--;
    }

    // Update likes count display
    const likesElement = previewModal.querySelector(
      ".previewliked-by strong:last-child"
    );
    likesElement.textContent = `${likesCount} others`;
  };

  // Add delete button handler
  const deleteBtn = previewModal.querySelector(".delete-btn");
  deleteBtn.onclick = () => {
    deleteImageFromFirebase(imageUrl);
    previewModal.style.display = "none";

    // Remove the image from the photo grid
    const photoItems = document.querySelectorAll(".photo-item");
    photoItems.forEach((item) => {
      if (item.querySelector("img").src === imageUrl) {
        item.remove();
      }
    });
  };

  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === previewModal) {
      previewModal.style.display = "none";
    }
  };
}

// Comment handling functions
async function handleCommentSubmit(imageUrl) {
  const commentInput = document.querySelector(".comment-text-input");
  const comment = commentInput.value.trim();
  const username = localStorage.getItem("username") || "Anonymous";

  if (!comment) return;

  try {
    // Add comment to Firestore
    const commentData = {
      username: username,
      text: comment,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      imageUrl: imageUrl,
    };

    await db.collection("comments").add(commentData);

    // Display the new comment immediately
    displayComment(commentData);

    // Clear input
    commentInput.value = "";

    console.log("Comment added successfully");
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Error posting comment. Please try again.");
  }
}

function displayComment(commentData) {
  const commentsContainer = document.createElement("div");
  commentsContainer.className = "comment-container";

  const commentElement = document.createElement("div");
  commentElement.className = "comment";
  commentElement.innerHTML = `
      <strong>${commentData.username}</strong> ${commentData.text}
      <span class="comment-timestamp">${
        commentData.timestamp
          ? new Date(commentData.timestamp.toDate()).toLocaleString()
          : "Just now"
      }</span>
    `;

  commentsContainer.appendChild(commentElement);

  // Add to comments section in preview modal
  const commentSection = document.querySelector(".previewcomment-section");
  commentSection.insertBefore(commentsContainer, commentSection.firstChild);
}

async function loadComments(imageUrl) {
  try {
    const querySnapshot = await db
      .collection("comments")
      .where("imageUrl", "==", imageUrl)
      .orderBy("timestamp", "desc")
      .get();

    // Clear existing comments
    const commentSection = document.querySelector(".previewcomment-section");
    const existingComments =
      commentSection.querySelectorAll(".comment-container");
    existingComments.forEach((comment) => comment.remove());

    // Display each comment
    querySnapshot.forEach((doc) => {
      displayComment(doc.data());
    });
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

// Load images from Firebase
async function loadImagesFromFirebase() {
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  try {
    const querySnapshot = await db
      .collection("images")
      .orderBy("timestamp", "desc")
      .get();
    const newsFeed = document.querySelector(".post-container");
    newsFeed.innerHTML = ""; // Clear existing images
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      addPostToNewsFeed(data.image, data.caption); // Add images and captions to the news feed
    });
  } catch (error) {
    console.error("Error loading images:", error);
  }
}

// Bookmark Button Functionality
const bookmarkButtonHandler = () => {
  const bookmarkButton = document.querySelector(".action-btnbookmark");
  bookmarkButton.classList.toggle("bookmarked");

  isBookmarked = !isBookmarked;

  console.log("Bookmark button clicked");
};

// Delete image from Firebase
async function deleteImageFromFirebase(imageUrl) {
  if (!storage || !db) {
    alert("Firebase not initialized");
    return;
  }

  try {
    const fileRef = storage.refFromURL(imageUrl);
    await fileRef.delete();

    const querySnapshot = await db
      .collection("images")
      .where("image", "==", imageUrl)
      .get();

    const batch = db.batch();
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Remove image from the photo grid
    const photoItems = document.querySelectorAll(".photo-item");
    photoItems.forEach((item) => {
      if (item.querySelector("img").src === imageUrl) {
        item.remove();
      }
    });

    alert("Image deleted successfully");
  } catch (error) {
    console.error("Error deleting image:", error);
    alert("Error deleting image. Please try again.");
  }
}
