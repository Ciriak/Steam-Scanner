import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import "./app.scss";
import IConfig from '../../interfaces/Config.interface';
import { ipcRenderer } from "electron";
import { GridManagerEvents } from '../../GridManager';


const config: IConfig = ipcRenderer.sendSync(GridManagerEvents.GET_CONFIG);

function App() {

    const [canSave, setCanSave] = useState(false);
    const [showSavedAlert, setShowSavedAlert] = useState(false);
    const [gridActive, setGridActive] = useState(ipcRenderer.sendSync(GridManagerEvents.GET_STATE_ACTIVE));

    const { register, handleSubmit } = useForm({
        defaultValues: config
    });

    /**
     * Send the updated config to the server
     * @param data
     */
    const onSubmit = (data: any) => {
        ipcRenderer.send(GridManagerEvents.SET_CONFIG, data);
        setCanSave(false);
        setShowSavedAlert(true);
    }
    const handleChange = () => {
        setCanSave(true);
    }

    const getGrid = () => {
        if (gridActive) {
            return;
        }
        ipcRenderer.send(GridManagerEvents.RUN_STEAM_GRID);
        setGridActive(true);
    }

    const stopGetGrid = () => {
        ipcRenderer.send(GridManagerEvents.STOP_STEAM_GRID);
        setGridActive(false);
    }

    const resetGrid = () => {
        ipcRenderer.send(GridManagerEvents.RESET_STEAM_GRID);
    }

    return (
        <div className="grid-manager">
            <Container>
                <h3>Steam Grid Management</h3>
                <Form onSubmit={handleSubmit(onSubmit)} onChange={() => { handleChange() }}>
                    <Form.Group controlId="retrieveAssets">
                        <Form.Check ref={register} name="enableGrid" type="checkbox" label="Automatically retrieve grid assets (Cover image, icon, etc...)" />
                    </Form.Group>

                    {gridView()}

                    <Alert variant="secondary">
                        Steam Scanner can use your tokens from external services to retrieve some grids assets more efficiency
                    </Alert>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>SteamGridDB Token</Form.Label>
                        <Form.Control type="text" ref={register} name="steamGridDbToken" placeholder="Enter your SteamGridDB token" />
                        <Form.Text className="text-muted">
                            You can generate one from <a target="_blank" href="https://www.steamgriddb.com/profile/preferences">here</a>
                        </Form.Text>
                    </Form.Group>

                    <Row>
                        <Col>
                            <Form.Group controlId="allowAnimatedCover">
                                <Form.Check type="checkbox" ref={register} name="animatedCover" label="Allow animated cover images" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>

                    </Row>
                    <Row>
                        <Col>
                            <Button type="submit" variant="primary" disabled={!canSave}>
                                Save
                        </Button>
                        </Col>
                        <Col className="text-right">
                            <Button variant="link" size="sm" onClick={() => resetGrid()}>Reset the grid</Button>
                        </Col>

                    </Row>

                    <Alert className="mt-2" variant="success" show={showSavedAlert} onClose={() => setShowSavedAlert(false)} dismissible>
                        Settings saved
                    </Alert>

                </Form>
            </Container>

            <div className="steamgrid-credits">
                Powered by <a href="https://github.com/boppreh/steamgrid" target="_blank">[SteamGrid]</a>
            </div>

        </div>
    );

    function gridView() {
        if (gridActive) {
            return (
                <Row className="grid-in-progress-info">
                    <span>Retrieving cover images...</span>
                    <span>  </span>
                    <Button variant='outline-danger' size="sm" className="mt-2 mb-2" onClick={() => { stopGetGrid() }}>Stop</Button>
                </Row>
            )
        }
        else {
            return (
                <Row>
                    <Button variant='secondary' className="mt-2 mb-2" disabled={gridActive} onClick={() => { getGrid() }}>Retrieve cover images</Button>
                </Row>
            )
        }
    }


}

export default App;
