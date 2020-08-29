import React from "react";
import Link from "next/link";
import { Layout, Carousel, Card, Descriptions, Image, Typography } from "antd";
import moment from "moment";
import markdownToHtml from "lib/markdownToHtml";

export default function CarouselWrapper({ jobs }) {
  const { Paragraph } = Typography;
  const upperGridStyle = { width: "50%", maxHeight: "400px" };

  return (
    <Layout style={{ background: "transparent" }}>
      <Carousel autoplay adaptiveHeight dotPosition="right">
        {jobs.map((job, index) => (
          <div key={index}>
            <Card style={{ background: "transparent" }}>
              <Card.Grid style={upperGridStyle}>
                <Descriptions title={job.company}>
                  <Descriptions.Item>
                    <Link href={`//${job.website}`}>{job.website}</Link>
                  </Descriptions.Item>
                </Descriptions>
                <Descriptions title="Title">
                  <Descriptions.Item>{job.position}</Descriptions.Item>
                </Descriptions>
                <Descriptions title="Dates">
                  <Descriptions.Item label="From">
                    {moment(job.start).format("M/D/YY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Until">
                    {!!job.end ? moment(job.end).format("M/D/YY") : "Now"}
                  </Descriptions.Item>
                </Descriptions>
              </Card.Grid>
              <Card.Grid style={upperGridStyle}>
                <Image
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                  src={
                    job.logo?.url
                      ? job.logo.url
                      : "https://via.placeholder.com/150"
                  }
                />
              </Card.Grid>
              <Card.Grid
                style={{ width: "100%", overflowY: "auto", maxHeight: "400px" }}
              >
                <Paragraph>{`${job.description}`}</Paragraph>
              </Card.Grid>
            </Card>
          </div>
        ))}
      </Carousel>
    </Layout>
  );
}
