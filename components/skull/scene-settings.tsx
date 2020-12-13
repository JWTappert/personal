import React, { useState } from "react";
import {
  Typography,
  Divider,
  Form,
  Checkbox,
  Radio,
  Modal,
  Button,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";
import Link from "next/link";
import styled from "styled-components";

export default function SceneSettings({
  rotateX,
  rotateY,
  selectedMaterial,
  onRotateXSelected,
  onRotateYSelected,
  onMaterialSelected,
}) {
  const materials = ["basic", "normal", "phong", "toon"];
  const { Title, Paragraph } = Typography;
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <ThemedButton
        size="large"
        icon={<SettingOutlined />}
        onClick={() => setShowModal(true)}
      ></ThemedButton>
      <ThemedModal
        title="Scene Settings"
        visible={showModal}
        centered
        onCancel={() => setShowModal(false)}
        footer={[
          <Button type="primary" key="done" onClick={() => setShowModal(false)}>
            Done
          </Button>,
        ]}
      >
        <Form>
          <Title level={3}>Rendering 3D objects with WebGL</Title>
          <Paragraph>
            I've seen some pretty neat 3D interactive experiences on the web in
            recent years and I wanted to learn how to do it myself. I completed
            the Creative Coding series on Frontend Masters, taught by{" "}
            <Link href="//www.mattdesl.com/">Matt Deslauriers</Link>, and
            decided it would be cool to add something like that to my own
            website. After pouring over the documentation of Three.js and
            OpenGL, I was able to put together this simple experience. Play
            around with it by changing the settings and clicking on the skull!
          </Paragraph>
          <Title level={4}>Rotation</Title>
          <Form.Item>
            <Checkbox
              checked={rotateX}
              onChange={() => onRotateXSelected(!rotateX)}
            >
              Rotate X
            </Checkbox>
            <Checkbox
              checked={rotateY}
              onChange={() => onRotateYSelected(!rotateY)}
            >
              Rotate Y
            </Checkbox>
          </Form.Item>
          <Title level={4}>Material</Title>
          <Form.Item>
            <Radio.Group
              onChange={({ target }) => onMaterialSelected(target)}
              value={selectedMaterial}
            >
              {materials.map((mat) => (
                <Radio key={mat} value={mat} checked={selectedMaterial === mat}>
                  {mat}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Form>
      </ThemedModal>
    </>
  );
}

const ThemedButton = styled(Button)`
  background: ${({ theme }) => theme.body} !important;
  color: ${({ theme }) => theme.text} !important;
`;

const ThemedModal = styled(Modal)`
  & .ant-modal-header {
    background: ${({ theme }) => theme.body} !important;
    border-bottom: ${({ theme }) => theme.toggleBorder} !important;
    
    > .ant-modal-title {
      color: ${({ theme }) => theme.text} !important;
    }
  }
  & .ant-modal-close {
    color: ${({ theme }) => theme.text} !important;
  }
  > .ant-modal-content {
    background-color: ${({ theme }) => theme.body} !important; 
    
    & .ant-checkbox + span, span.ant-radio + * {
      color: ${({ theme }) => theme.text} !important;
    }
  }
  & .ant-modal-footer {
    border-top: ${({ theme }) => theme.toggleBorder} !important;
  }
`
