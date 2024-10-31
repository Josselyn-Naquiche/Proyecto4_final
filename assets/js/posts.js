import { auth, createPost, onGetPosts, getCurrentUserId, updatePostLikes, fetchPosts} from "./config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { deletePost, getPost, updatePost } from "./config.js";


const btnLogout = document.getElementById('logout');
const postForm = document.getElementById('postForm');
const postText = document.getElementById('postText');
const postImage = document.getElementById('postImage');

const postsContainer = document.getElementById('postsContainer');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuario está autenticado:", user);
        // Actualiza el contenedor de bienvenida
        document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
        document.getElementById('userAvatar').src = user.photoURL    || 'https://via.placeholder.com/40'; // Usa un avatar por defecto si no hay foto
        document.getElementById('descri').texContent = user.email
    } else {
        console.log("Usuario no está autenticado.");
        window.location.href = 'index.html'; // Redirige si no hay usuario
    }
});

postForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = postText.value;
    const image = postImage.files[0];
    
    createPost(text, image).then(() => {
        alert("Publicación creada exitosamente");
        postForm.reset();
    }).catch((error) => {
        console.error("Error al crear la publicación:", error);
    });
});

// Función para mostrar las publicaciones
function displayPosts(posts) {
    postsContainer.innerHTML = ''; // Limpiar el contenedor
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('col-12'); // Configuración de columnas responsive
        postElement.innerHTML = `
            <div class="card  h-100 mb-3 ">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                        <img src="${post.authorPhoto}" alt="Foto de perfil" class="rounded-circle" width="40" height="40">
                        <h6 class="card-subtitle mb-0 ms-2 ">${post.authorName || 'Usuario Desconocido'}</h6>
                    </div>
                    <p class="card-text">${post.text}</p>
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Imagen de publicación" class="img-fluid rounded" width="300" height="200">` : ''}
                </div>
                <div class="card-footer text-muted d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-outline-primary btn-sm like-btn" data-id="${post.id}">
                            <i class="bi bi-hand-thumbs-up"></i> <span>${post.likes ? Object.keys(post.likes).length : 0}</span>
                        </button>
                        <button class="btn btn-outline-danger btn-sm dislike-btn" data-id="${post.id}">
                            <i class="bi bi-hand-thumbs-down"></i> <span>${post.dislikes ? Object.keys(post.dislikes).length : 0}</span>
                        </button>
                    </div>
                    <div class="">
                        <button class="btn btn-outline-warning btn-sm edit-btn" data-id="${post.id}">
                            <i class="bi bi-pencil-square"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${post.id}">
                            <i class="bi bi-trash"></i> Borrar
                        </button>
                    </div>
                    <small>${post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'Fecha no disponible'}</small>
                </div>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });

    // Función para editar publicaciones
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    // Añadir el evento click para editar
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.getAttribute('data-id');
            const postDoc = await getPost(postId); // Obtener los datos de la publicación
            const postData = postDoc.data();

            // Llenar el formulario con los datos de la publicación a editar
            postText.value = postData.text;

            // Crear un botón para confirmar la edición
            const editConfirmBtn = document.createElement('button');
            const ocultarPost = document.getElementById('agregarPost')
            const ocultarBtn = document.getElementById('agregaBtn')
            editConfirmBtn.textContent = 'Confirmar Edición';
            editConfirmBtn.classList.add('btn', 'btn-success', 'mt-2');
            ocultarPost.classList.add('d-none')
            ocultarBtn.classList.add('d-none')
            postForm.appendChild(editConfirmBtn);

            // Listener para confirmar la edición
            editConfirmBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await updatePost(postId, { text: postText.value });
                alert('Publicación actualizada con éxito');
                postForm.reset();
                editConfirmBtn.remove();
                ocultarPost.classList.remove('d-none')
                ocultarBtn.classList.remove('d-none')
                displayPosts(await fetchPosts()); // Refresca las publicaciones
            });
        });
    });

    // Funcionalidad de borrar
    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.getAttribute('data-id');
            const confirmDelete = confirm('¿Estás seguro de que deseas borrar esta publicación?');
            if (confirmDelete) {
                await deletePost(postId);
                alert('Publicación eliminada');
                displayPosts(await fetchPosts()); // Refresca las publicaciones
            }
        });
    });

        // Añadir listeners a los botones de like y dislike después de que se hayan añadido las publicaciones
    const likeButtons = document.querySelectorAll('.like-btn');
    const dislikeButtons = document.querySelectorAll('.dislike-btn');

    likeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.getAttribute('data-id');
            const userId = getCurrentUserId();
            if (userId) {
                await updatePostLikes(postId, userId, 'like');
                displayPosts(await fetchPosts()); // Refresca las publicaciones
            }
        });
    });

    dislikeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.getAttribute('data-id');
            const userId = getCurrentUserId();
            if (userId) {
                await updatePostLikes(postId, userId, 'dislike');
                displayPosts(await fetchPosts()); // Refresca las publicaciones
            }
        });
    });
}


// Llamada a la función que escucha las publicaciones en tiempo real
onGetPosts(displayPosts);


// Mostrar el formulario de edición al hacer clic en "Editar perfil"
document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('editProfileBtn').style.display = 'none';
});

// Cancelar la edición y ocultar el formulario
document.getElementById('cancelEditBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('profileForm').style.display = 'none';
    document.getElementById('editProfileBtn').style.display = 'block';
});


// Cerrar sesión
btnLogout.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log("Cierre de sesión exitoso.");
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("Error al cerrar sesión:", error);
            alert("No se pudo cerrar sesión. Intenta de nuevo.");
        });
});

