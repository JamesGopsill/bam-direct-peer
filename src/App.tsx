import React, { FC } from "react"
import { PageHeader, Row, Col, Tabs } from "antd"
import "./App.css"

import { PrinterPeerAgent } from "./PrinterPeerAgent"
import { SubmissionPeerAgent } from "./SubmissionPeerAgent"

const { TabPane } = Tabs


const App: FC = () => {
	return (
		<React.Fragment>
			<PageHeader title="Peer 2 Peer Demonstration"/>
			<Tabs defaultActiveKey="1" style={{paddingLeft:25, paddingRight: 25}}>
				<TabPane tab="Manage Printer" key="1">
					<Row justify="space-around">
						<Col span={20}>
							<PrinterPeerAgent />
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Submit Job" key="2">
					<Row justify="space-around">
						<Col span={20}>
							<SubmissionPeerAgent />
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Dev" key="3">
					<Row justify="space-around">
						<Col span={11}>
							<PrinterPeerAgent />
						</Col>
						<Col span={11}>
							<SubmissionPeerAgent />
						</Col>
					</Row>
				</TabPane>
			</Tabs>
		</React.Fragment>
	)
}

export default App