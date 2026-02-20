import { useState, useEffect } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import {
  AppBar, Toolbar, Typography, Container, Card,
  CardContent, CardActionArea, CardMedia, Grid, Paper,
  TableContainer, Table, TableBody, TableHead, TableRow, TableCell,
  Button, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from "@material-ui/core";
import image from "./bg.png";
import { DropzoneArea } from 'material-ui-dropzone';
import { common } from '@material-ui/core/colors';
import Clear from '@material-ui/icons/Clear';
import axios from "axios";
import React from "react";

const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(common.white),
    backgroundColor: common.white,
    '&:hover': {
      backgroundColor: '#ffffff7a',
    },
  },
}))(Button);

const useStyles = makeStyles((theme) => ({
  grow: { flexGrow: 1 },
  appbar: {
    background: '#be6a77',
    boxShadow: 'none',
    color: 'white',
  },
  mainContainer: {
    backgroundImage: `url(${image})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    height: "100vh",
    overflow: "hidden",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modelSelector: {
    marginTop: theme.spacing(2),
    minWidth: 260,
    backgroundColor: '#ffffffee',
    borderRadius: '12px',
    padding: theme.spacing(1),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  gridContainer: {
    justifyContent: "center",
    padding: "1em 1em 0 1em",
  },
  imageCard: {
    margin: "auto",
    maxWidth: 360,
    backgroundColor: 'white',
    boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.2)',
    borderRadius: '16px',
  },
  imageCardEmpty: {
    height: 'auto',
  },
  media: {
    height: 280,
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    objectFit: 'cover',
  },
  dropzone: {
    minHeight: '260px',
    padding: theme.spacing(2),
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: theme.spacing(1),
  },
  tableCell: {
    fontSize: '20px',
    backgroundColor: 'transparent',
    color: '#333',
    fontWeight: 'bold',
  },
  tableCell1: {
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: '#666',
    fontWeight: 'bold',
  },
  clearButton: {
    width: "100%",
    borderRadius: "12px",
    padding: "12px 20px",
    color: "#000000cc",
    fontSize: "18px",
    fontWeight: 700,
    marginTop: theme.spacing(2),
  },
  buttonGrid: {
    maxWidth: "360px",
    width: "100%",
  },
  loader: { color: '#be6a77 !important' },
}));

export const ImageUpload = () => {
  const classes = useStyles();
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [data, setData] = useState();
  const [image, setImage] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [modelIndex, setModelIndex] = useState("1");

  const modelEndpoints = {
    "1": process.env.REACT_APP_MODEL1_URL,
    "2": process.env.REACT_APP_MODEL2_URL,
    "3": process.env.REACT_APP_MODEL3_URL,
    "4": process.env.REACT_APP_MODEL4_URL,
    "5": process.env.REACT_APP_MODEL5_URL, // ✅ SVM
  };

  const sendFile = async () => {
    if (image) {
      let formData = new FormData();
      formData.append("file", selectedFile);
      try {
        let res = await axios.post(modelEndpoints[modelIndex], formData);
        if (res.status === 200) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Prediction failed. Please try again.");
      } finally {
        setIsloading(false);
      }
    }
  };

  const clearData = () => {
    setData(null);
    setImage(false);
    setSelectedFile(null);
    setPreview(null);
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!preview) return;
    setIsloading(true);
    sendFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, modelIndex]);

  const onSelectFile = (files) => {
    if (!files || files.length === 0) {
      setSelectedFile(undefined);
      setImage(false);
      setData(undefined);
      return;
    }
    setSelectedFile(files[0]);
    setData(undefined);
    setImage(true);
  };

  return (
    <React.Fragment>
      <AppBar position="static" className={classes.appbar}>
        <Toolbar>
          <Typography className={classes.title} variant="h6" noWrap>
            Potato Disease Classifier
          </Typography>
          <div className={classes.grow} />
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} className={classes.mainContainer} disableGutters>
        <FormControl className={classes.modelSelector}>
          <InputLabel>Select a Model</InputLabel>
          <Select value={modelIndex} onChange={(e) => setModelIndex(e.target.value)}>
            <MenuItem value={"1"}>CNN</MenuItem>
            <MenuItem value={"2"}>MobileNetV2</MenuItem>
            <MenuItem value={"3"}>ResNet50</MenuItem>
            <MenuItem value={"4"}>Random Forest</MenuItem>
            <MenuItem value={"5"}>Support Vector Machine (SVM)</MenuItem>
          </Select>
        </FormControl>

        <Grid container className={classes.gridContainer} spacing={2} justifyContent="center">
          <Grid item xs={12}>
            <Card className={`${classes.imageCard} ${!image ? classes.imageCardEmpty : ''}`}>
              {!image ? (
                <CardContent className={classes.dropzone}>
                  <DropzoneArea
                    acceptedFiles={['image/*']}
                    dropzoneText="Drop or click to upload a potato leaf image (JPG/PNG)"
                    onChange={onSelectFile}
                    filesLimit={1}
                    showAlerts={false}
                    showPreviewsInDropzone={false}
                    showFileNames
                  />
                </CardContent>
              ) : (
                <CardActionArea>
                  <CardMedia className={classes.media} image={preview} component="image" />
                </CardActionArea>
              )}

              {isLoading && (
                <CardContent className={classes.detail}>
                  <CircularProgress color="secondary" className={classes.loader} />
                  <Typography variant="body1">Processing...</Typography>
                </CardContent>
              )}

              {data && (
                <CardContent className={classes.detail}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell className={classes.tableCell1}>Label</TableCell>
                          <TableCell align="right" className={classes.tableCell1}>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell className={classes.tableCell}>{data.class}</TableCell>
                          <TableCell align="right" className={classes.tableCell}>{(parseFloat(data.confidence) * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="h6" style={{ marginTop: '16px' }}>About the Disease:</Typography>
                  <Typography variant="body2" align="center" style={{ padding: '0 12px' }}>
                    {data.class === "Early Blight" &&
                      "Early blight causes dark spots on older leaves. Remedy: Use fungicides and rotate crops."}
                    {data.class === "Late Blight" &&
                      "Late blight creates large, dark patches and white mold. Remedy: Destroy infected plants and use resistant varieties."}
                    {data.class === "Healthy" &&
                      "This leaf appears healthy. No treatment is necessary."}
                  </Typography>
                </CardContent>
              )}
            </Card>
          </Grid>

          {data && (
            <Grid item className={classes.buttonGrid}>
              <ColorButton
                variant="contained"
                className={classes.clearButton}
                onClick={clearData}
                startIcon={<Clear fontSize="large" />}
              >
                Clear
              </ColorButton>
            </Grid>
          )}
        </Grid>
      </Container>
    </React.Fragment>
  );
};
