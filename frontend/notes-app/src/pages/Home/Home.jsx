import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import { MdAdd } from 'react-icons/md';
import AddEditNotes from './AddEditNotes';
import Modal from "react-modal";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstance';


const Home = () => {

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type:'add',
    date: null,
  });

  const [allNotes, setAllNotes] = useState([]);
  const[userInfo, setUserInfo] = useState(null);
  
  const navigate = useNavigate();

  //Get User Info 
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if(response.data && response.data.user) {
        setUserInfo(response.data.user); 
      }
    } catch (error){
      if(error.response.data === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  //Get All Notes
  const getAllNotes = async () => {
    try {
      console.log("Token being sent:", localStorage.getItem("token"));
      const response = await axiosInstance.get("/get-all-notes");
      console.log("API Response:", response.data);
      
      if(response.data && response.data.notes){
        setAllNotes(response.data.notes);
        console.log("Notes after setting:", response.data.notes);
      }
    } catch (error) {
      console.error("Error details:", error);
    }
  };

  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => {};
  }, []);
  
  return (  
    <>
      <Navbar userInfo={userInfo} />

      <div className='container mx-auto'>
        <div className="grid grid-cols-3 gap-4 mt-8">
        {allNotes.map((note) => (
           <NoteCard 
           key={note._id}
           title={note.title}
           date={note.createdOn}
           content={note.content}
           tags={note.tags}
           isPinned={note.isPinned}
           onEdit={() => {}}
           onDelete={() => {}}
           onPinNote={() => {}}
           />
  ))}
          </div>
      </div>
      <button className='w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10'
      onClick={() => {
        setOpenAddEditModal({ isShown: true, type: "add", date: null });
      }}>
        <MdAdd className='text-[32px] text-white' />
      </button>
      
      <Modal 
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
          },
        }}
        contentLabel=""
        className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 overflow-scroll"
        >
      <AddEditNotes
      type={openAddEditModal.type}
      noteData =  {openAddEditModal.data}
        onClose={() => {
          setOpenAddEditModal({ isShown: false, type: "add", data: null });
      }} 
      />
      </Modal>
    </>
  );
};

export default Home