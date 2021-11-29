import React, { FC, useEffect, useState } from "react"
import { Card, Button, Form, Input } from "antd"
import Peer from "peerjs"
import { UltimakerClient } from "ultimaker-client"

export const PrinterPeerAgent: FC = () => {

	const [id, setId] = useState<string>("")
	const [networkStatus, setNetworkStatus] = useState<string>("disconnected")
	const [printerStatus, setPrinterStatus] = useState<string>("idle")
	const [peer, setPeer] = useState<Peer | null>(null)
	const [ultimakerClient, setUltimakerClient] = useState<UltimakerClient>()

	const updatePrinterStatus = async () => {
		try {
			const s = await ultimakerClient.getPrinterStatus()
			setPrinterStatus(s)
		} catch {}
	}

	useEffect(() => {
		if (ultimakerClient) {
			updatePrinterStatus()
		}
	}, [ultimakerClient])

	const joinNetwork = async (form: {
		id: string
		ip: string
		key: string
	}) => {

		console.log(form)

		if (!form.id || !form.ip|| !form.key) {
			console.log("Missing Details")
			return
		}

		setUltimakerClient(new UltimakerClient(form.ip))
		const uC = new UltimakerClient(form.ip)
		setId(form.id)

		// Connect to the Peer

		const p = new Peer(form.id, {
			key: form.key,
			path: "/myp2p",
			host: window.location.hostname,
			port: 80,
			debug: 0
		})

		p.on("open", (id) => {
			console.log("Connection brokered", id)
			setNetworkStatus("connected")
		})

		p.on("connection", (conn) => {
			console.log("A connection is being made")

			conn.on("data", async (message: { 
				type: string 
				gcode?: string
			}) => {

				if (message.type == "status") {
					conn.send({
						response: {
							name: form.id,
							status: printerStatus
						},
						error: null
					})
					return
				}

				if (message.type == "job" && !message.gcode) {
					conn.send({
						response: null,
						error: "No gcode sent"
					})
					return
				}
			
				if (message.type == "job" && printerStatus == "printing") {
					conn.send({
						response: null,
						error: "I am currently printing"
					})
					return
				}

				if (message.type == "job" && printerStatus == "idle") {
					try {

						const res = uC.postJob("BAM", message.gcode)

						setNetworkStatus("disconnected")
						setPrinterStatus("printing")
						conn.send({
							response: "Print Accepted",
							error: null
						})
						setTimeout(() => {
							peer.destroy()
							setPeer(null)
						}, 1000)
					} catch (err) {
						console.log(err)
					}
					return
				}


			});

			conn.on("close", () => {
				console.log("Connection Closed")
			})
			
		})

		p.on("disconnected", () => {
			console.log("Disconnected")
		})

		p.on("error", (err) => {
			console.log(err)
		})

		setPeer(p)
	}


	return (
		<Card title="Printer Peer" style={{ width: "100%" }} extra={`${id} (${networkStatus}) (${printerStatus})`}>
			<Form onFinish={joinNetwork}>
				<Form.Item name="id">
					<Input placeholder="Set Printer ID" />
				</Form.Item>
				<Form.Item name="ip">
					<Input placeholder="Printer IP Address" />
				</Form.Item>
				<Form.Item name="key">
					<Input placeholder="Peer Key" />
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit">Join Network</Button>
				</Form.Item>
			</Form>
		</Card>
	)
}
