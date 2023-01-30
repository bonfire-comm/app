import Message from '../classes/message';

export default function coupleMessages(messages: Message[]) {
  // couple messages to an array if:
  // 1. coupled messages should be only from the same author
  // 2. the message createdAt date in a group must be within 5 minutes each
  // 3. each group only can hold 10 messages
  // use array functions to make it easier to read

  return messages
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .reduce((acc, message) => {
      const last = acc[acc.length - 1];
      if (!last) {
        return acc.concat([[message]]);
      }

      const lastMessage = last[last.length - 1];
      if (
        message.author === lastMessage.author
        && message.createdAt.getTime() - lastMessage.createdAt.getTime() <= 1000 * 60 * 5
        && last.length < 10
      ) {
        last.push(message);
      } else {
        acc.push([message]);
      }

      return acc;
    }, [] as Message[][]);
}