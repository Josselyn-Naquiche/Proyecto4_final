import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL,  uploadBytes } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    
  
    apiKey: "AIzaSyAK2XwjNw553jLxXtipNNVnI53A64fnDHM",
    authDomain: "proyecto4-e0675.firebaseapp.com",
    projectId: "proyecto4-e0675",
    storageBucket: "proyecto4-e0675.appspot.com",
    messagingSenderId: "512574537773",
    appId: "1:512574537773:web:4503d5bb365fc881e6f8a4",
    measurementId: "G-3EMBHPK9DL"
  

  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider(); // Proveedor de Google


//--------------AUTH-----------------------//

// Función para registrar un nuevo usuario
export function registerUser(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Registro exitoso. ¡Bienvenido!");
            window.location.href = 'posts.html';
        })
        .catch((error) => {
            console.error("Error al registrar:", error.code, error.message);
            alert("Error al registrar: " + error.message);
        });
}

// Función para iniciar sesión
export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log(userCredential);            
            console.log("Inicio de sesión exitoso. ¡Bienvenido!");
            window.location.href = 'posts.html';
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.code, error.message);
            alert("Error al iniciar sesión: " + error.message);
        });
}

// Función para iniciar sesión con Google
export function loginWithGoogle() {
    return signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Inicio de sesión con Google exitoso. ¡Bienvenido!", result.user);
            window.location.href = 'posts.html';
        })
        .catch((error) => {
            console.error("Error al iniciar sesión con Google:", error.code, error.message);
            alert("Error al iniciar sesión con Google: " + error.message);
        });
}



document.addEventListener("DOMContentLoaded", () => {
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                console.error("No hay un usuario autenticado");
                return;
            }
            
            const newUsername = document.getElementById('username').value;
            const profileImageFile = document.getElementById('profileImage').files[0];
            
            try {
                let photoURL = user.photoURL;

                if (profileImageFile) {
                    const imageRef = ref(storage, `profilePictures/${user.uid}`);
                    await uploadBytes(imageRef, profileImageFile);
                    photoURL = await getDownloadURL(imageRef);
                }

                await updateProfile(user, { displayName: newUsername, photoURL });
                document.getElementById('userName').textContent = newUsername;
                document.getElementById('userAvatar').src = photoURL;

                alert('Perfil actualizado exitosamente');
            } catch (error) {
                console.error("Error al actualizar el perfil:", error);
                alert('Hubo un error al actualizar el perfil');
            }
        });
    }
});

//--------------POSTS-----------------------//

export function createPost(text, imageFile) {
    let imageUrl = null;

    if (imageFile) {
        const storageRef = ref(storage, `images/${auth.currentUser.uid}/${imageFile.name}`);
        return uploadBytes(storageRef, imageFile).then((snapshot) => {
            return getDownloadURL(snapshot.ref);
        }).then((url) => {
            imageUrl = url;
            return savePost(text, imageUrl);
        });
    } else {
        return savePost(text, null);
    }
}

// Guardar la publicación en Firestore
function savePost(text, imageUrl) {
    const user = auth.currentUser;
    const post = {
        authorId: user.uid,
        authorName: user.displayName || user.email.split('@')[0],  // Usa el displayName o el email como nombre
        authorPhoto: user.photoURL || 'https://via.placeholder.com/40',  // Foto de perfil
        text: text,
        firstDescription: user.email,
        imageUrl: imageUrl,
        likes: 0,
        dislikes: 0,
        createdAt: new Date() // Usar la fecha actual como timestamp
    };
    return addDoc(collection(db, 'posts'), post);
}


export function onGetPosts(callback) {
    onSnapshot(collection(db, 'posts'), (snapshot) => {
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() }); // Agregar ID y datos de cada publicación
        });
        callback(posts); // Llamar al callback con las publicaciones
    });
}

//---------------LIKE-DISLIKE------------------------//

// Función para obtener el ID del usuario actual
export const getCurrentUserId = () => {
    const user = auth.currentUser;
    return user ? user.uid : null; // Retorna el ID del usuario autenticado o null
};

// Función para actualizar los likes en la base de datos
export const updatePostLikes = async (postId, userId, action) => {
    console.log("Post ID:", postId);
    console.log("User ID:", userId);
    console.log("Action:", action);
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
        const postData = postDoc.data();
        let likes = postData.likes || {};
        let dislikes = postData.dislikes || {};

        if (action === 'like') {
            if (dislikes[userId]) {
                delete dislikes[userId]; // Elimina el dislike si el usuario ya lo había dado
            }
            likes[userId] = true; // Añade o actualiza el like
        } else if (action === 'dislike') {
            if (likes[userId]) {
                delete likes[userId]; // Elimina el like si el usuario ya lo había dado
            }
            dislikes[userId] = true; // Añade o actualiza el dislike
        }

        // Actualiza el post en Firestore
        await updateDoc(postRef, { likes, dislikes });
    }
};

export function addComment(postId, comment) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No hay usuario autenticado");
    }
    const commentData = {
        authorId: user.uid,
        authorName: user.displayName || user.email.split('@')[0],
        authorPhoto: user.photoURL || 'https://via.placeholder.com/40',
        text: comment,
        createdAt: new Date()
    };
    return addDoc(collection(db, 'posts', postId, 'comments'), commentData);
}

export function onGetComments(postId, callback) {
    onSnapshot(collection(db, 'posts', postId, 'comments'), (snapshot) => {
        const comments = [];
        snapshot.forEach(doc => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        callback(comments);
    });
}


export async function fetchPosts() {
    const querySnapshot = await getDocs(collection(db, 'posts'));
    const posts = [];
    querySnapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
}

// obtener una publicación específica
export function getPost(id) {
    return getDoc(doc(db, 'posts', id));
}
// actualizar una publicación
export function updatePost(id, newFields) {
    return updateDoc(doc(db, 'posts', id), newFields);
}
// borrar una publicación
export function deletePost(id) {
    return deleteDoc(doc(db, 'posts', id));
}



// Exportar autenticación y base de datos
export { auth};

