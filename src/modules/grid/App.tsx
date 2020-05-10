import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import "./app.scss";
import IConfig from '../../interfaces/Config.interface';
import { ipcRenderer, remote, shell } from "electron";
import { GridManagerEvents } from '../../GridManager';


const config: IConfig = ipcRenderer.sendSync(GridManagerEvents.GET_CONFIG);

function App() {

    const [canSave, setCanSave] = useState(false);
    const [showSavedAlert, setShowSavedAlert] = useState(false);

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

    return (
        <div className="grid-manager">
            <Container>
                <h3>Steam Grid Management</h3>
                <Form onSubmit={handleSubmit(onSubmit)} onChange={() => { handleChange() }}>
                    <Form.Group controlId="retrieveAssets">
                        <Form.Check ref={register} name="enableGrid" type="checkbox" label="Automatically retrieve grid assets (Cover image, icon, etc...)" />
                    </Form.Group>
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
                        <Button type="submit" variant="primary" disabled={!canSave}>
                            Save
                        </Button>
                    </Row>

                    <Alert className="mt-2" variant="success" show={showSavedAlert} onClose={() => setShowSavedAlert(false)} dismissible>
                        Settings saved
                    </Alert>

                </Form>
            </Container>
        </div >
    );


}

export default App;
