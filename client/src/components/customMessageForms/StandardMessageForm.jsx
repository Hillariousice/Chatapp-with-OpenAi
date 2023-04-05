import React, { useState } from 'react'
import Dropzone from 'react-dropzone'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
const StandardMessageForm = ({props, activeChat}) => {
  const [message,setMessage] = useState("")
  const [attachments,setAttachments]= useState("")
  const [preview,setPreview] = useState("")
  
  const handleChange = (e) => {
    setMessage(e.target.value)
    }
  const handleSubmit = async() => {
    const date = new Date().toISOString().replace("T", ' ').replace("Z", `${Math.floor(Math.random() *1000)}+00:00`)
    const at = attachments ? [{blob:attachments, file:attachments.name}] : []
    const form = {
      attachment: at,
      created: date,
      sender_username: props.username,
      text: message,
      activeChatId: activeChat.id
  }
  props.onSubmit(form)
  setAttachments("")
  setMessage("")
}
  return (
    <div className="message-form-container">
      {preview && (
        <div className="message-form-preview">
          <img src={preview} onLoad={()=>URL.revokeObjectURL(preview)}  alt="message-form-preview" className="message-form-preview-image" />
        <XMarkIcon
        className="message-form-icon-x"
        onClick={()=>{
          setPreview("")
          setAttachments("")
        }}/>
        </div>

      )}
      <div className="message-form">
        <div className="message-form-input-container">
          <input
          className="message-form-assist"
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."

          />
        </div>
      <div className="message-form-icons">
        <Dropzone
        acceptedFiles=".jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav,.pdf"
        multiple={false}
        onClick={true}
        onDrop={(acceptedFiles) => {
          setAttachments(acceptedFiles[0])
         setPreview(URL.createObjectURL(acceptedFiles[0]))
         
        }}
        >
          {({getRootProps, getInputProps,open}) => (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <PaperClipIcon className="message-form-icon-clip" onClick={open}/>
            </div>
          )}
        </Dropzone>
        <hr className="vertical-line"/>
        <PaperAirplaneIcon className="message-form-icon-airplane" onClick={()=>{

        setPreview("")
        handleSubmit()
        }}/>
      </div>
      </div>
    </div>
  )
}

export default StandardMessageForm
