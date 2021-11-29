import React, { FC, useState } from "react"
import { Card, Space, Button, Table, PageHeader, Form, Upload, Select, notification, Input } from "antd"
import Peer from "peerjs"

const { Option } = Select

export const SubmissionPeerAgent: FC = () => {

	const [id, setId] = useState<string>("")
	const [networkStatus, setNetworkStatus] = useState<string>("disconnected")
	const [fileList, setFileList] = useState<any[]>([])


	const onFinish = (form: {
		id: string
		key: string
		operation: string
	}) => {
		console.log("Talking to the Printer")
		console.log(form)

		if (!form.id && !form.key) {
			notification["error"]({
				message: "Missing Details"
			})
		}

		const p = new Peer({
			key: form.key,
			path: "/myp2p",
			host: window.location.hostname,
			port: 80,
			debug: 0
		})

		p.on("open", (id) => {
			console.log("Connection brokered", id)
			setNetworkStatus("connected")

			if (form.operation == "status") {

				console.log("Accessing the printer for its status")
	
				const conn = p.connect(form.id, { reliable: true, serialization: "json" })
	
				conn.on("open", () => {
					console.log("Connection Open")
					conn.send({
						type: "status"
					})
				})
	
				conn.on("data", (msg: any) => {
					console.log(msg)
					notification["success"]({
						description: msg.response.status,
						message: msg.response.name
					})
					p.destroy()
					setNetworkStatus("disconnected")
				})
				
			}

			if (form.operation == "job") {

				// TODO: check for file

				if (!(fileList.length > 0)) {
					notification["error"]({
						message: "Missing GCode"
					})
					p.destroy()
					return
				}
	
				const conn = p.connect(form.id, { reliable: true, serialization: "json" })
	
				conn.on("open", async () => {
					console.log("Connection Open")
					conn.send({
						type: "job",
						gcode: await fileList[0].text()
					})
				})
	
				conn.on("data", (message: any) => {
					console.log(message)
					if (message.error == null) {
						notification["success"]({
							description: form.id,
							message: "Job Sent"
						})
					} else {
						notification["error"]({
							description: form.id,
							message: "Oooops, something went wrong"
						})
					}
					p.destroy()
					setNetworkStatus("disconnected")
				})
			}
		})

		p.on("disconnected", () => {
			console.log("Disconnected")
		})

		p.on("error", (err) => {
			console.log(err)
		})
	}

	const beforeUpload = (file: any) => {
		// Add the file to the file list
		setFileList([file])
		return false
	}

	const onRemove = (file: any) => {
		setFileList(fL => {
			const index = fL.indexOf(file);
			const nFL = fL.slice();
			nFL.splice(index, 1);
			return nFL
		})
	}


	return (
		<Card title="Submission Peer" style={{ width: "100%" }} extra={`${name} (${networkStatus})`}>
			<Form
				name="basic"
				onFinish={onFinish}
			>
				<Form.Item name="id">
					<Input placeholder="Printer ID" />
				</Form.Item>
				<Form.Item name="key">
					<Input placeholder="Peer Key" />
				</Form.Item>
				<Form.Item name="operation" initialValue="status">
					<Select>
						<Option value="status">Get Status</Option>
						<Option value="job">Print Job</Option>
					</Select>
				</Form.Item>
				<Form.Item>
					<Upload beforeUpload={beforeUpload} onRemove={onRemove} fileList={fileList}>
						<Button>Upload</Button>
					</Upload>
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit">
						Submit
					</Button>
				</Form.Item>
			</Form>
			
		</Card>
	)

}

/*

<Form.Item>
					<Upload beforeUpload={beforeUpload} onRemove={onRemove} fileList={fileList}>
						<Button>Upload</Button>
					</Upload>
				</Form.Item>
				<Form.Item>
				<Select onChange={machineSelected}>
					{machines.map(m => <Option key={m.id} value={m.id}>{m.id}</Option>)}
				</Select>
				</Form.Item>

	const [name, setName] = useState<string>("submitter_"+uniqueNamesGenerator({
		dictionaries: [adjectives, colors, animals],
	}))
	const [networkStatus, setNetworkStatus] = useState<string>("disconnected")
	const [peer, setPeer] = useState<Peer>()
	const [machine, setMachine] = useState<string>("")
	const [machines, setMachines] = useState<{
		id: string
		status: string
		queueLength: number
	}[]>([])
	const [fileList, setFileList] = useState<any[]>([])

	const joinNetwork = () => {
		// console.log("Hello")

		const p = new Peer(name, {
			key: "peerjs",
			path: "/myp2p",
			host: window.location.hostname,
			port: 80,
			debug: 0
		})

		p.on("open", (id) => {
			console.log("Connection brokered", id)
			setNetworkStatus("connected")
		})

		setPeer(p)

	}

	const getMachines = async () => {

		console.log("Get Machines")

		setMachines([])

		const res = await fetch("/myp2p/peerjs/peers", {
			method: "GET",
		})

		if (res.status != 200) {
			console.log(res)
			return
		}

		const addressBook: string[] = await res.json()
		console.log(addressBook)
		for (const address of addressBook) {
			// console.log(address)
			if (address.startsWith("machine")) {
				// connect to the machine and ask for its status.
				const conn = peer.connect(address, { reliable: true, serialization: "json" })

				conn.on("open", () => {
					console.log("Connection Open")
					conn.send({
						type: "status"
					})
				})

				conn.on("data", (message: any) => {
					console.log(message)
					setMachines((prevState) => {
						return [...prevState, message]
					})
					conn.close()
				})

			}
		}

	}

	const onFinish = async () => {
		console.log("On Finish")

		const payload = {
			type: "job",
			gcode: await fileList[0].text()
		}
		
		console.log(payload)

		// TODO: checks

		const conn = peer.connect(machine, { reliable: true, serialization: "json" })

		conn.on("open", () => {
			console.log("Connection Open")
			conn.send(payload)
		})

		conn.on("data", (message: any) => {
			console.log(message)
			notification["success"]({
				message: "Successfully submitted job"
			})
			conn.close()
		})
	}

	const [form] = Form.useForm()

	const beforeUpload = (file: any) => {
		// Add the file to the file list
		setFileList([file])
		return false
	}

	const onRemove = (file: any) => {
		setFileList(fL => {
			const index = fL.indexOf(file);
			const nFL = fL.slice();
			nFL.splice(index, 1);
			return nFL
		})
	}

	const machineSelected = (id: string) => {
		setMachine(id)		
	}

	const machineColumns = [
		{
			title: "Name",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
		},
		{
			title: "Queue Length",
			dataIndex: "queueLength",
			key: "queueLength",
		},
	]

	return (
		<Card title="Submission Peer" style={{ width: "100%" }} extra={`${name} (${networkStatus})`}>
			<Space>
				<Button onClick={joinNetwork}>Join Network</Button>
				<Button onClick={getMachines}>Get Machines</Button>
			</Space>
			<PageHeader title="Available Machines" />
			<Table rowKey="id" dataSource={machines} columns={machineColumns} />
			<PageHeader title="Submit Job" />
			<Form
				name="basic"
				onFinish={onFinish}
				form={form}
			>
				<Form.Item>
					<Upload beforeUpload={beforeUpload} onRemove={onRemove} fileList={fileList}>
						<Button>Upload</Button>
					</Upload>
				</Form.Item>
				<Form.Item>
				<Select onChange={machineSelected}>
					{machines.map(m => <Option key={m.id} value={m.id}>{m.id}</Option>)}
				</Select>
				</Form.Item>
				<Form.Item>
					<Button disabled={fileList.length === 0} type="primary" htmlType="submit">
						Submit
					</Button>
				</Form.Item>
			</Form>
			
		</Card>
	)
}
*/