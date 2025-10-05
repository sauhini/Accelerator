import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const tools = [
  { id: "tool1", name: "NLP -> UX" },
  { id: "tool2", name: "UX -> Web UI" },
  { id: "tool3", name: "UX -> Mobile UI" },
];

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [payload, setPayload] = useState({
    image: null,
    requirement: "",
    viewType: "Web",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [imagesURL, setImagesURL] = useState([]);
  const [zipFileURL, setZipFileURL] = useState([])
  const [tool2Payload, setTool2Payload] = useState({
    figmaLink: "",
    framework: "React"
  })

  useEffect(() => {
    getImages();
    getAppZips(tool2Payload.framework)
  }, []);

  const getAppZips = (framework) => {
    
    axios
      .get(`http://127.0.0.1:8000/list-zips/${framework}Zip`)
      .then((res) => {
        // console.log("images   ", res.data.image_urls);
        setZipFileURL(res.data.zipped_apps);
      })
      .catch((error) => {
        console.log("Error fetching images ", error);
      });
  }  

  const getImages = () => {
    axios
      .get("http://127.0.0.1:8000/images")
      .then((res) => {
        console.log("images   ", res.data.image_urls);
        setImagesURL(res.data.image_urls);
      })
      .catch((error) => {
        console.log("Error fetching images ", error);
      });
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    setPayload({ ...payload, image: file });
  };

  const handlePromptFile = async (event) => {
    const file = event.target.files[0];
    const text = await file.text();
    console.log("Prompt Text:", text);
    setPayload({ ...payload, requirement: text });
  };

  const handleChange = (e) => {
    setPayload({ ...payload, [e.target.name]: e.target.value });
  };


  const generate = async () => {
    // setTime(0)
    setIsLoading(true);
    if (payload.requirement) {
      const formData = new FormData();
      // formData.append("ui_image", payload.image);
      formData.append("user_prompt", payload.requirement);
      formData.append("device_view", payload.viewType);
      // let figma_url = "https://www.figma.com/design/gIJdLP3e9Hrb7FB4iY7UxZ/Untitled?node-id=120-209&t=iVmv2wWWl1THtI5J-1"
      // const params = new URLSearchParams(new URL(figma_url).search);
      // const ids = params.get("node-id");
      // const fileId = figma_url.split("/")[4];
      // formData.append("figma_file_id", fileId);
      // formData.append("figma_node_ids", ids);
      // console.log("figma_url   ", figma_url);

      const callApiWithRetry = async () => {
        let attempts = 0;
        const maxAttempts = 4;

        while (attempts < maxAttempts) {
          try {
            const response = await axios.post(
              "http://127.0.0.1:8000/generate",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (response.status === 500) {
              attempts++;
              console.warn(
                `Attempt ${attempts}. Retrying...`
              );

              continue;
            }

            console.log("API Success:", response.data);
            toast.success("Figma Successfully generated.", {
                    autoClose: 10000, // 30 seconds
                    position: "top-center",
              });
              setIsLoading(false);
            break; // Exit loop on success
          } catch (error) {
            attempts++;

            // Axios wraps the response in error.response
            if (error.response && error.response.status === 500) {
              console.warn(
                `Attempt ${attempts}: Server error (500). Retrying...`
              );
            } else {
              console.error(`Attempt ${attempts}: ${error.message}`);
            }

            if (attempts >= maxAttempts) {
              setIsLoading(false)
              console.error("Max retry attempts reached. Stopping.");
              toast.error("Max retry attempts reached. Stopping. Please try again later.", {
                    autoClose: 3000, // 30 seconds
              });
            }
          }
        }
      };

      callApiWithRetry()
    }
  };

  const tool2HandleChange = (e) => {
    const { value, name } = e.target
    setTool2Payload({
      ...tool2Payload, [name]: value
    })
    if(name === "framework"){
      getAppZips(value)
    }
  }

  const uiGenerate = async () => {
    setIsLoading(true)
    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/uitoreact",
        tool2Payload
      );
      if(response.status === 200){
        setIsLoading(false)
        toast.success("App Successfully Created.", {
          autoClose: 10000, // 30 seconds
          position: "top-center",
        });
      }else{
      setIsLoading(false)
      toast.error("Something Went Wrong", {
        autoClose: 3000, // 30 seconds
      });
      }
    } catch(error){
      setIsLoading(false)
      toast.error("Error: " + error, {
        autoClose: 3000, // 30 seconds
      });
    }
  }

  useEffect(() => {
    console.log(tool2Payload)
  }, [tool2Payload])

  const renderFields = () => {
    switch (activeTool) {
      case "tool1":
        return (
          <div>
            <h3>NLP to UX</h3>
            {/* <label>Upload Sample Image:</label>
            <br />
            <input type="file" className="file" onChange={handleFile} />
            <br />
            <br /> */}
            <label>User Requirement: </label>
            <span>
              <a href={"http://127.0.0.1:8000/getprompttemplate"} download>
                Download Sample Prompt
              </a>
            </span>
            <br />
            {/* <textarea
              rows="4"
              cols="50"
              className="textarea"
              onChange={handleChange}
              name="requirement"
            /> */}
            <input type="file" className="file" onChange={handlePromptFile} />
            <br />
            <br />
            <label>View Type:</label>
            <br />
            <select className="select" onChange={handleChange} name="viewType">
              <option>Web</option>
              <option>Mobile</option>
            </select>
            <br />
            <br />
            <button className="button" disabled={isLoading} onClick={generate}>
              {isLoading ? `Generating, Please wait...` : "Generate"}
            </button>
            <ToastContainer />
            
              {imagesURL.length > 0 &&
                imagesURL.map((img) => {
                  return (
                    <div className="image-container">
                      <a href={img} target="_blank">
                        <img src={img} alt="img" />
                      </a>
                    </div>
                  );
                })}
          </div>
        );
      case "tool2":
        return (
          <div>
            <label>Figma page share link:</label>
            <br />
            <input className="file w-48 h-33" type="text" onChange={tool2HandleChange} name="figmaLink"/>
            <br />
            <br />
            <label>Select Framework:</label>
            <br />
            <select className="select" name="framework" onChange={tool2HandleChange}>
              <option value="React">React</option>
              <option value="Angular">Angular</option>
              <option value="Vue" disabled>Vue</option>
            </select>
            <br />
            <br />
            <button className="button" disabled={isLoading} onClick={uiGenerate}>
              {
            isLoading ? "Generating Code, Please Wait..." : "Generate Code"
            }
            </button>
            <div className="list-container">
            {
              zipFileURL.length > 0 &&
              zipFileURL.map((zip) => {
                return (
                  <div className="list-form">
                    <ul>
                    <li >
                      <a href={`http://127.0.0.1:8000/downloadzip/${tool2Payload.framework}Zip/${zip}`} download>{zip}</a>
                    </li>
                    </ul>
                  </div>
                )
              })
            }
            </div>
          </div>
        );
      case "tool3":
        return (
          <div>
            <h3>Coming soon...</h3>
            {/* <label>Enter Description:</label>
            <br />
            <textarea rows="4" cols="50" />
            <br />
            <br />
            <button>Generate Code</button> */}
          </div>
        );
      default:
        return <p>Select a tool from the left to begin.</p>;
    }
  };

  return (
    <>
      <h1>FrontVelocity.AI</h1>
      <div className="dashboard">
        <div className="sidebar">
          <h2>Tools</h2>
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`tool ${activeTool === tool.id ? "active" : ""}`}
              onClick={() => setActiveTool(tool.id)}
            >
              {tool.name}
            </div>
          ))}
        </div>
        <div className="content">{renderFields()}</div>
      </div>
    </>
  );
}

export default App;
