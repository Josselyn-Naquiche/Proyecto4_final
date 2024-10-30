import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL,  uploadBytes } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCX405bvseZBDXhmbCIBueSrJFd1ildPpk",
    authDomain: "proyecto4-final.firebaseapp.com",
    projectId: "proyecto4-final",
    storageBucket: "proyecto4-final.appspot.com",
    messagingSenderId: "153455877998",
    appId: "1:153455877998:web:cbea6718f862488addab7f",
    measurementId: "G-MS1HM6928D"
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

export async function fetchPosts() {
    const querySnapshot = await getDocs(collection(db, 'posts'));
    const posts = [];
    querySnapshot.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
}

// Función para obtener una publicación específica
export function getPost(id) {
    return getDoc(doc(db, 'posts', id));
}
// Función para actualizar una publicación
export function updatePost(id, newFields) {
    return updateDoc(doc(db, 'posts', id), newFields);
}
// Función para borrar una publicación
export function deletePost(id) {
    return deleteDoc(doc(db, 'posts', id));
}



// Exportar autenticación y base de datos
export { auth};

