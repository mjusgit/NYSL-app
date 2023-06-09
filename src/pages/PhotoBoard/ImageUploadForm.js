import React from "react";
import { useState } from "react";
import { ref } from "firebase/storage";
import { storage } from "../../firebase";
import { v4 } from "uuid";
import { uploadBytesResumable } from "firebase/storage";
import { getDownloadURL } from "firebase/storage";
import { auth } from "../../firebase";
import { collection } from "firebase/firestore";
import { database } from "../../firebase";
import { addDoc } from "firebase/firestore";
export 
const ImgUploadForm = ({ setImgUrl, setProgressPercent }) => {
  const [matchId, setMatchId] = useState('');
  const [description, setDescription] = useState('');

  const handleOnSubmit = async (e) => {
    e.preventDefault(); // prevent auto submission

    const file = e.target[0]?.files[0];
    console.log(file);

    if (!file) return;

    const imageRef = ref(storage, `images/${file.name + v4()}`);

    //upload file
    const uploadTask = uploadBytesResumable(imageRef, file);

    // state changed
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgressPercent(progress);
      },
      (error) => {
        alert(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setImgUrl(downloadUrl);

          // Save additional information to Firestore
          const messageRef = collection(database, 'NorthsidePhotoBoard', 'photos', matchId);
          try {
            const docRef = await addDoc(messageRef, {
              match: matchId,
              description: description,
              author: auth.currentUser.displayName,
              imageURL: downloadUrl,
              uid: auth.currentUser.uid,
            });
            console.log('Message added with ID:', docRef.id);
          } catch (error) {
            console.error('Error adding message:', error);
          }
         });
      }
  
  // Generate match options dynamically
  const matchOptions = Array.from({ length: 17 }, (_, index) => (
    <option key={index} value={`Match ${index + 1}`}>
      Match {index + 1}
    </option>
  ));

  return (
    <form className="img-upload-form" onSubmit={handleOnSubmit}>
      <div className="img-upload-options">
        <input type="file" required />
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)} required>
          {matchOptions}
        </select>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
      </div>
      <button type="submit" className="upload-button">Upload</button>
    </form>
  );
};
